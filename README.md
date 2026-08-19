# JackPass — Academic Question Bank Platform

An academic question bank platform for Nigerian students: search, view, and solve past questions from Nigerian universities and institutions. Includes community-driven lecturer profiles with reviews and ratings.

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 5, React 18, TypeScript (strict) |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Styling | Tailwind CSS 3, shadcn/ui, next-themes |
| Forms | React Hook Form + Zod |
| Backend API | Express (TypeScript, run via tsx) |
| Database / Auth / Storage | Supabase |
| Payments | Paystack |
| AI | Genkit (Google AI) for OCR metadata extraction, Hugging Face OCR |

## 📁 Project Structure

```
├── public/                  # Static assets (favicon, manifest)
├── src/
│   ├── ai/                  # Genkit flows (server-only)
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── common/          # Header, Footer, Logo, ThemeProvider, ThemeToggle
│   │   ├── auth/            # RequireAuth / RequireAdmin guards
│   │   ├── questions/       # QuestionCard, QuestionView, SearchFilters
│   │   ├── lecturers/       # ReviewCard, WriteReviewForm
│   │   └── admin/           # AdminLayout, QuestionReviewCard
│   ├── contexts/            # AuthContext (Supabase auth state)
│   ├── hooks/               # TanStack Query hooks (questions, lecturers)
│   ├── lib/                 # supabase clients, paystack, ocr, subscription, mappers, types
│   ├── pages/               # Route components (Home, Login, Profile, Billing, Community, ...
│   ├── styles/              # globals.css (Tailwind + design tokens + animations)
│   ├── App.tsx              # Providers + route table
│   └── main.tsx             # Entry (QueryClient + BrowserRouter)
├── e2e/                     # Playwright E2E + visual regression tests
├── server/                  # Express API server
│   ├── routes/              # questions, upload, admin, payments, lecturers, ...
│   └── index.ts             # Server entry (serves dist/ in production)
├── supabase/migrations/     # SQL migration files
└── scripts/                 # validate-env.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (uses the global `File` API server-side)
- npm 10+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase project URL + anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side, never ship to the client)
- `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` — Paystack credentials
- `GOOGLE_AI_API_KEY` — Google AI key for Genkit flows
- `HF_TOKEN` — optional; enables real Hugging Face OCR (falls back to mock OCR in dev)
- `NEXT_PUBLIC_APP_URL` — your public URL, used for the Paystack callback

> **Note on env names:** the Vite client only sees `VITE_*` vars; the Express server reads the
> `NEXT_PUBLIC_*` / non-prefixed vars. The `validate:env` script checks both sets.
>
> **Note on Supabase URLs:** if your URL includes a `/rest/v1/` path, it is normalized
> automatically — supabase-js appends that path itself.

### 3. Run in development

```bash
npm run dev
```

This starts two processes concurrently:

| Process | Port | Purpose |
|---------|------|---------|
| Express API | `9001` | All `/api/*` endpoints |
| Vite dev server | `9003` | HMR client, proxies `/api` → `:9001` |

Open http://localhost:9003.

### 4. Build & run in production

```bash
npm run build     # tsc --noEmit && vite build
npm run start     # tsx server/index.ts — serves dist/ + API on :9002 (or $PORT)
```

Open http://localhost:9002.

### 5. Quality gates

```bash
npm run lint         # ESLint, zero warnings allowed
npm run typecheck    # tsc --noEmit
npm run test:run     # Vitest (jsdom + Testing Library)
npm run validate:env # Checks that all required env vars are set
npm run genkit:dev   # Genkit flow dev UI
```

## 🔐 Auth & Route Protection

- `AuthProvider` (Supabase) restores the session, tracks `user`, `loading`, `online`, and `isAdmin`.
- `RequireAuth` redirects unauthenticated users to `/login` (preserving the intended destination).
- `RequireAdmin` redirects non-admin users to `/admin/login?error=not_admin`.
- Server-side: all admin/upload/subscription routes verify the user's JWT
  (`Authorization: Bearer <access_token>`) and admin routes additionally verify `is_admin`.

## 🖥 API Endpoints (Express)

### Questions & Upload
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/questions` | — | Approved questions (filters: institution, course, year, semester, type) |
| GET | `/api/questions/:id` | ✅ | Single question (includes linked lecturer if set) |
| POST | `/api/upload` | ✅ | Multipart upload → Supabase Storage → async OCR + Genkit extraction |
| GET | `/api/upload?id=` | ✅ | Upload processing status |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/questions` | admin | Moderation list (+ filters) |
| POST | `/api/admin/questions/:id/:action` | admin | Approve / reject a question |

### Lecturer Profiles
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/lecturers` | — | List/search lecturers |
| POST | `/api/lecturers` | ✅ | Create a new lecturer profile |
| GET | `/api/lecturers/:id` | — | Lecturer detail (courses, question count) |
| PUT | `/api/lecturers/:id` | ✅ | Update lecturer fields |
| GET | `/api/lecturers/:id/questions` | ✅ | All questions by this lecturer |
| GET | `/api/lecturer-reviews/lecturer/:id` | — | Reviews for a lecturer |
| POST | `/api/lecturer-reviews` | ✅ | Write/update a review |
| POST | `/api/lecturer-reviews/:id/vote` | ✅ | Upvote/downvote a review |
| POST | `/api/lecturer-flags` | ✅ | Flag content for moderation |
| GET | `/api/lecturer-flags` | admin | Pending flags |
| GET | `/api/lecturer-photos/lecturer/:id` | — | Photos for a lecturer |
| POST | `/api/lecturer-photos` | ✅ | Upload a photo |

### Payments & Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/initiate` | ✅ | Create a Paystack transaction |
| GET | `/api/payments/verify?reference=` | — | Verify a payment |
| POST | `/api/payments/webhook` | signature | Paystack webhook (HMAC-verified) |
| GET | `/api/user/subscription` | ✅ | Current user's subscription |

### Users & AI
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:userId/uploads` | — | Questions uploaded by a user |
| POST | `/api/ai/process-document` | — | Run the Genkit document flow |

**Upload pipeline:** file → Supabase Storage → `question_uploads` → async OCR → Genkit metadata extraction → `questions` (pending) → admin approval → public.

## 🧪 Testing

### Unit / component tests (Vitest + React Testing Library)

- `src/**/*.{test,spec}.{ts,tsx}` — jsdom environment.
- Coverage via `@vitest/coverage-v8` (`npx vitest run --coverage`).

```bash
npm run test:run
```

### End-to-end tests (Playwright)

The E2E suite in `e2e/` covers the core user journeys against the real dev stack
(Express API + Vite dev server, both started automatically by Playwright):

| Journey | Spec | What's covered |
|---------|------|----------------|
| Browse | `e2e/browse.spec.ts` | Home render, empty state, card → detail link, course & institution filters |
| Auth | `e2e/auth.spec.ts` | Login/signup validation, invalid credentials, successful login, password toggle, route guards |
| Upload | `e2e/upload.spec.ts` | Signed-out redirect, dialog open, file/link validation, end-to-end upload with AI pre-fill |
| Admin | `e2e/admin.spec.ts` | Admin guards (signed-out, non-admin), moderation list, approve/reject |

The tests mock external services (Supabase auth, Supabase data, AI, upload) at the
network layer via `e2e/helpers/mocks.ts`, so the suite is deterministic and needs
no real credentials or seeded data.

```bash
# First run: ensure the Chromium browser is installed
npx playwright install chromium

npm run test:e2e          # headless
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:headed   # watch the browser
npm run test:all          # unit + E2E
```

### Visual regression

`e2e/visual.spec.ts` snapshots the key pages (Home, Login, Community, Support,
Billing, Profile, Settings, Admin Questions, Question-not-found) **in both light
and dark themes** and compares them against stored baselines, so design changes
can't silently drift. Rendering is deterministic: services are mocked, the theme
is pinned before load, animations are disabled, and authed pages run the mocked
login flow first.

```bash
npm run test:visual            # compare against baselines
npm run test:visual:update     # regenerate baselines (use deliberately!)
```

Baselines live in `e2e/visual.spec.ts-snapshots/` and are **OS/browser-specific**
(suffix like `-chromium-win32`): generate them on the same platform CI uses, and
commit them with the design change they document. `test:e2e` runs the visual
suite as part of the full Playwright run.

> Playwright starts both dev servers automatically (`:9001` API + `:9003` Vite);
> already-running instances are reused outside CI.
> Playwright reuses already-running servers locally and starts them in CI.

## 🗄️ Database Setup (Supabase)

The SQL migrations are in `supabase/migrations/`:

1. **Base schema** (`00000000000000_base_schema.sql`) — creates `user_profiles`, `questions`, `question_uploads`, `payments`, `subscriptions`
2. **Lecturer profiles** (`20260819010000_apply_missing.sql`) — adds `lecturers`, `lecturer_reviews`, `lecturer_votes`, `lecturer_flags`, `lecturer_photos` tables, `lecturer_id` FK on questions, RPC functions, and RLS policies

**To apply:** Open Supabase SQL Editor → paste each migration → Run. The second migration is idempotent (safe to re-run).

**Storage bucket:** Create a `question-files` bucket (public) in Supabase Dashboard → Storage.

## 📦 Deployment

### Docker

```bash
docker build -t jackpass .
docker run -p 9002:9002 --env-file .env.local jackpass
```

### Manual

1. `npm ci && npm run build`
2. `NODE_ENV=production PORT=9002 npm run start`

The Express server serves both the API and the built SPA (with client-side routing fallback).

## 🔒 Security Notes

- `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GOOGLE_AI_API_KEY`, and `HF_TOKEN` are
  **server-only** — they are never referenced by client code and never enter the Vite bundle.
- Paystack webhooks are verified with an HMAC-SHA512 signature over the raw request body.
- All admin mutations re-check `is_admin` server-side (not just the client guard).

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | API + Vite dev servers (concurrently) |
| `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Express API dev server (tsx watch) |
| `npm run build` | Typecheck + production build |
| `npm run start` | Production server (API + static SPA) |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (zero warnings) |
| `npm run typecheck` | TypeScript check |
| `npm run test:run` | Vitest run |
| `npm run test:e2e` | Playwright E2E suite (headless) |
| `npm run test:e2e:ui` | Playwright E2E in interactive UI mode |
| `npm run test:all` | Unit + E2E tests |
| `npm run validate:env` | Environment variable validation |
| `npm run genkit:dev` | Genkit flow dev UI |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and type checking
4. Submit a pull request

## 📄 License

MIT
