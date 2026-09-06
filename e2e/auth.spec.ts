import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';

test.describe('login (OAuth)', () => {
  test('shows Google and Apple sign-in buttons and no password form', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
    // The email/password form is gone
    await expect(page.getByPlaceholder('m@example.com')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toHaveCount(0);
  });

  test('Google button starts the provider sign-in flow', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Continue with Google' }).click();

    // The SDK builds the authorize URL client-side and redirects the browser
    // to it (the Supabase host is a placeholder in tests, so the navigation
    // fails to load — but the URL target proves the flow started correctly).
    await expect(page).toHaveURL(/\/auth\/v1\/authorize\?provider=google/);
    await expect(page).toHaveURL(/redirect_to=.*%2Fauth%2Fcallback/);
  });

  test('Apple button starts the provider sign-in flow', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Continue with Apple' }).click();

    await expect(page).toHaveURL(/\/auth\/v1\/authorize\?provider=apple/);
    await expect(page).toHaveURL(/redirect_to=.*%2Fauth%2Fcallback/);
  });
});

test.describe('signup (OAuth)', () => {
  test('shows Google and Apple sign-in buttons and no sign-up form', async ({ page }) => {
    await installMocks(page);
    await page.goto('/signup');

    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign Up' })).toHaveCount(0);
  });
});

test.describe('route guards', () => {
  test('redirects signed-out users away from protected pages', async ({ page }) => {
    await installMocks(page);
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login$/);
    // The OAuth login card renders
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('redirects signed-out users away from billing', async ({ page }) => {
    await installMocks(page);
    await page.goto('/billing');

    await expect(page).toHaveURL(/\/login$/);
  });
});