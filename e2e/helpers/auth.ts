import { expect, type Page } from '@playwright/test';

/**
 * Authenticates through the ADMIN email/password form using the mocked
 * Supabase auth. The public /login and /signup pages are OAuth-only now
 * (Google/Apple), so automated tests keep using the admin form, which is the
 * only place email/password sign-in remains.
 *
 * After signing in, lands on the home page and dismisses toasts so they can't
 * obscure later assertions.
 */
export async function loginAs(page: Page) {
  await page.goto('/admin/login');
  await page.getByPlaceholder('your@email.com').fill('student@example.com');
  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Admin Login', exact: true }).click();
  // Admin login routes to /admin (then /admin/dashboard for admins, or back to
  // /admin/login?error=not_admin for non-admins) — wait for that navigation so
  // the mocked session is fully stored before we move on.
  await expect(page).toHaveURL(/\/admin\//);
  await page.goto('/');
  // Dismiss any lingering success/error toasts.
  await page.evaluate(() => {
    document.querySelectorAll('[role="status"] button').forEach((b) => (b as HTMLButtonElement).click());
  });
}