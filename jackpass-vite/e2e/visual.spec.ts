import { test, expect, type Page } from '@playwright/test';
import { installMocks } from './helpers/mocks';

/**
 * Visual regression suite.
 *
 * Snapshots the key pages in BOTH themes against stored baselines so design
 * changes can't silently drift. Rendering is deterministic because:
 *   - external services are mocked at the network layer (installMocks)
 *   - the theme is pinned via localStorage before any app code runs (no flash)
 *   - animations are disabled (reduced-motion emulation + `animations: 'disabled'`)
 *   - authed pages perform the mocked login flow first (guards would otherwise
 *     redirect to /login, and the success toast is dismissed before capture)
 *
 * Baselines live in `e2e/visual.spec.ts-snapshots/`. Regenerate them
 * deliberately when a design change is intended:
 *
 *   npm run test:visual:update
 *
 * Baselines are OS/browser-specific — generate them on the same platform CI uses.
 */

const THEMES = ['dark', 'light'] as const;

async function prepare(page: Page, theme: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
}

/** Mocked login (see auth.spec.ts). Dismisses the success toast afterwards. */
async function loginAs(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('m@example.com').fill('student@example.com');
  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/');
  // Radix toast close button (no accessible name, so query by role/status).
  await page.evaluate(() => {
    document.querySelectorAll('[role="status"] button').forEach((b) => (b as HTMLButtonElement).click());
  });
}

async function snapshotPage(page: Page, path: string, theme: string, name: string) {
  await page.goto(path);
  // Wait for web fonts + layout to settle before capturing.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);

  await expect(page).toHaveScreenshot(`${name}-${theme}.png`, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
    threshold: 0.2,
  });
}

test.describe('visual regression', () => {
  for (const theme of THEMES) {
    test(`home page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await snapshotPage(page, '/', theme, 'home');
    });

    test(`login page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await snapshotPage(page, '/login', theme, 'login');
    });

    test(`community page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await snapshotPage(page, '/community', theme, 'community');
    });

    test(`support page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await snapshotPage(page, '/support', theme, 'support');
    });

    test(`billing page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await loginAs(page);
      await snapshotPage(page, '/billing', theme, 'billing');
    });

    test(`profile page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await loginAs(page);
      await snapshotPage(page, '/profile', theme, 'profile');
    });

    test(`settings page — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await loginAs(page);
      await snapshotPage(page, '/settings', theme, 'settings');
    });

    test(`admin questions — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page, { isAdmin: true });
      await loginAs(page);
      await snapshotPage(page, '/admin/questions', theme, 'admin-questions');
    });

    test(`question not found — ${theme}`, async ({ page }) => {
      await prepare(page, theme);
      await installMocks(page);
      await snapshotPage(page, '/questions/00000000-0000-4000-8000-000000000000', theme, 'question-not-found');
    });
  }
});
