import type { Page } from '@playwright/test';

/**
 * Seeded approved questions returned by GET /api/questions.
 * Institution names exactly match entries in src/lib/institutions.ts so the
 * SearchFilters combobox filtering works.
 */
export const MOCK_QUESTIONS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Calculus I',
    institution: 'University of Lagos',
    course: 'MTH 101',
    year: 2023,
    semester: 'First',
    type: 'Objective',
    status: 'approved',
    contentPreview: 'Find the derivative of x^2.',
    fullContent: 'Find the derivative of x^2 with respect to x.',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Data Structures',
    institution: 'University of Ibadan',
    course: 'CSC 301',
    year: 2022,
    semester: 'Second',
    type: 'Theory',
    status: 'approved',
    contentPreview: 'Explain binary search trees and their operations.',
    fullContent: 'Explain binary search trees and describe the operations of insertion, deletion, and search.',
  },
];

/**
 * Seeded questions for the admin moderation view.
 */
export const MOCK_ADMIN_QUESTIONS = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Organic Chemistry Reactions',
    institution: 'University of Lagos',
    course: 'CHM 202',
    year: 2024,
    semester: 'First',
    type: 'Theory',
    status: 'pending',
    content_preview: 'Outline the mechanism of electrophilic aromatic substitution.',
    full_content: 'Outline the mechanism of electrophilic aromatic substitution with examples.',
    answer: 'The mechanism involves attack of the electrophile to form a sigma complex...',
    explanation: 'Arenium ion stability determines the rate-determining step.',
    uploader_id: '33333333-3333-4333-8333-333333333333',
    created_at: '2024-05-01T10:00:00.000Z',
    ai_extracted_data: {
      confidence: {
        overall: 0.92,
        institution: 0.95,
        course: 0.9,
        year: 0.95,
        semester: 0.9,
        type: 0.85,
      },
    },
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Thermodynamics Laws',
    institution: 'University of Ibadan',
    course: 'PHY 112',
    year: 2023,
    semester: 'Second',
    type: 'Objective',
    status: 'approved',
    content_preview: 'State the first law of thermodynamics.',
    full_content: 'State and explain the first law of thermodynamics.',
    uploader_id: '44444444-4444-4444-8444-444444444444',
    created_at: '2024-04-15T10:00:00.000Z',
  },
];

export interface MockOptions {
  /** Return an admin user profile (is_admin = true). */
  isAdmin?: boolean;
  /** Questions returned by GET /api/questions. */
  questions?: typeof MOCK_QUESTIONS;
  /** Questions returned by GET /api/admin/questions. */
  adminQuestions?: typeof MOCK_ADMIN_QUESTIONS;
}

const MOCK_USER_ID = '55555555-5555-4555-8555-555555555555';

function buildUser(isAdmin: boolean) {
  return {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'student@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone: '',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: 'Test Student' },
    identities: [
      {
        id: MOCK_USER_ID,
        user_id: MOCK_USER_ID,
        identity_data: { sub: MOCK_USER_ID, email: 'student@example.com' },
        provider: 'email',
        last_sign_in_at: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    // Used by the app to render profile info
    ...(isAdmin ? { user_metadata: { name: 'Admin User' } } : {}),
  };
}

export function buildSession(isAdmin = false) {
  const user = buildUser(isAdmin);
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user,
  };
}

/**
 * Intercept Supabase auth, Supabase data, and JackPass API requests so the
 * browser never talks to real services.
 */
export async function installMocks(page: Page, options: MockOptions = {}) {
  const { isAdmin = false, questions = MOCK_QUESTIONS, adminQuestions = MOCK_ADMIN_QUESTIONS } = options;
  const session = buildSession(isAdmin);

  // ── Supabase auth ───────────────────────────────────────────────────────
  // Generic fallback FIRST (Playwright matches in reverse registration order,
  // so more specific patterns must be registered after this one).
  await page.route('**/auth/v1/**', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, json: {} });
    }
    return route.fulfill({ status: 401, json: { error: 'unauthenticated' } });
  });
  // signInWithPassword / token refresh
  await page.route('**/auth/v1/token*', (route) => route.fulfill({ json: session }));
  // signUp — return a valid auth response so the client can parse it
  await page.route('**/auth/v1/signup', (route) => route.fulfill({ json: session }));
  // getUser()
  await page.route('**/auth/v1/user', (route) => {
    if (route.request().method() === 'POST') {
      // logOut / admin user delete — treat as success
      return route.fulfill({ status: 200, json: {} });
    }
    return route.fulfill({ json: buildUser(isAdmin) });
  });

  // ── Supabase data (postgrest) ───────────────────────────────────────────
  // Admin status check — queried with `.single()`, which uses an
  // application/vnd.pgrst.object+json Accept header, so respond with an
  // OBJECT (not an array).
  await page.route('**/rest/v1/user_profiles*', (route) =>
    route.fulfill({
      json: isAdmin
        ? { id: MOCK_USER_ID, is_admin: true }
        : {},
    })
  );

  // ── JackPass API ────────────────────────────────────────────────────────
  // Public question list + detail
  await page.route('**/api/questions', (route) => route.fulfill({ json: questions }));
  await page.route('**/api/questions?*', (route) => route.fulfill({ json: questions }));
  await page.route('**/api/questions/*', (route) =>
    route.fulfill({ status: 404, json: { error: 'Question not found' } })
  );

  // Admin endpoints
  // Server-side admin check (bypasses RLS) — called by AuthContext after login
  await page.route('**/api/admin/me', (route) =>
    route.fulfill({ json: { isAdmin } })
  );
  await page.route('**/api/admin/questions*', (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('institutions') === 'true') {
      return route.fulfill({ json: ['University of Lagos', 'University of Ibadan'] });
    }
    // Respect the status filter the page sends (defaults to "pending")
    const status = url.searchParams.get('status');
    const filtered =
      status && status !== 'all'
        ? adminQuestions.filter((q) => q.status === status)
        : adminQuestions;
    return route.fulfill({ json: filtered });
  });
  await page.route('**/api/admin/questions/*/*', (route) =>
    route.fulfill({ json: { success: true } })
  );

  // Analytics (usage tracking + admin analytics)
  await page.route('**/api/events', (route) =>
    route.fulfill({ json: { ok: true } })
  );
  await page.route('**/api/admin/analytics/overview*', (route) =>
    route.fulfill({
      json: { sessions: 120, pageViews: 540, uniqueUsers: 45, avgSessionDuration: 128, totalEvents: 700 },
    })
  );
  await page.route('**/api/admin/analytics/series*', (route) =>
    route.fulfill({
      json: [
        { date: '2026-08-10', pageViews: 12, events: 18, sessions: 6 },
        { date: '2026-08-11', pageViews: 20, events: 30, sessions: 9 },
        { date: '2026-08-12', pageViews: 15, events: 22, sessions: 7 },
      ],
    })
  );
  await page.route('**/api/admin/analytics/pages*', (route) =>
    route.fulfill({
      json: [
        { page: '/library', views: 150 },
        { page: '/', views: 120 },
        { page: '/community', views: 60 },
      ],
    })
  );
  await page.route('**/api/admin/analytics/events*', (route) =>
    route.fulfill({
      json: [
        { event: 'search_performed', count: 42 },
        { event: 'question_viewed', count: 30 },
        { event: 'upload_submitted', count: 8 },
      ],
    })
  );
  await page.route('**/api/admin/analytics/funnels*', (route) =>
    route.fulfill({
      json: [
        {
          name: 'Upload Flow',
          steps: [
            { event: 'upload_dialog_opened', sessions: 20, conversion: null },
            { event: 'upload_submitted', sessions: 12, conversion: 0.6 },
          ],
        },
      ],
    })
  );

  // Feedback board
  await page.route('**/api/feedback', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        json: {
          item: {
            id: 'new-item',
            title: 'Created item',
            description: null,
            category: 'General',
            status: 'open',
            user_id: null,
            created_at: new Date().toISOString(),
            votes: 0,
            myVote: false,
          },
        },
      });
    }
    return route.fulfill({
      json: {
        items: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            title: 'PDF downloads for past questions',
            description: 'Let students download exam papers as PDFs.',
            category: 'General',
            status: 'open',
            user_id: null,
            created_at: '2026-08-01T10:00:00.000Z',
            votes: 5,
            myVote: false,
          },
          {
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            title: 'Dark mode toggle for the library',
            description: null,
            category: 'Study Tools',
            status: 'planned',
            user_id: null,
            created_at: '2026-08-02T10:00:00.000Z',
            votes: 3,
            myVote: false,
          },
        ],
      },
    });
  });
  await page.route('**/api/feedback/*/vote', (route) =>
    route.fulfill({ json: { voted: true, votes: 6 } })
  );
  await page.route('**/api/admin/feedback/*/status', (route) =>
    route.fulfill({ json: { success: true, item: { id: 'x', status: 'planned' } } })
  );

  // Weekly email digest (admin test send)
  await page.route('**/api/admin/digest/send*', (route) =>
    route.fulfill({
      json: { ok: true, to: ['admin@example.com'], window: { start: '2026-08-31', end: '2026-09-06' }, resendId: 're_mock_1' },
    })
  );

  // Upload + AI processing
  await page.route('**/api/upload', (route) =>
    route.fulfill({
      json: {
        success: true,
        uploadId: 'upload-1',
        fileUrl: 'https://example.com/file.pdf',
        message: 'File uploaded and processed successfully',
      },
    })
  );
  await page.route('**/api/ai/process-document', (route) =>
    route.fulfill({
      json: {
        institutionName: 'University of Lagos',
        courseName: 'MTH 101',
        courseCode: 'MTH 101',
        academicSession: '2023/2024',
        semester: 'First',
        fullContent: 'Mock extracted question content.',
      },
    })
  );

  // User uploads (profile page)
  await page.route('**/api/users/*/uploads', (route) => route.fulfill({ json: [] }));

  // Subscription + payments (never exercised without a real session, but keep
  // the API layer deterministic if a page touches it)
  await page.route('**/api/user/subscription', (route) =>
    route.fulfill({ json: { tier: 'free', status: 'active' } })
  );
  await page.route('**/api/payments/**', (route) => route.fulfill({ json: {} }));

  // Supabase realtime websocket — not needed in tests
  await page.route('**/supabase.co/realtime/**', (route) => route.abort());
}
