import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';

test.describe('login (OAuth)', () => {
  test('shows Google and Apple sign-in buttons with the password form hidden', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
    // The email/password fallback exists but is collapsed behind a link
    await expect(page.getByPlaceholder('m@example.com')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sign in with email/ })).toBeVisible();
  });

  // Pre-OAuth accounts must not be locked out of the UI, so the OAuth-first card
  // still offers a way back to email/password sign-in.
  test('reveals the email/password form for accounts created before OAuth', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await page.getByRole('button', { name: /Sign in with email/ }).click();
    await expect(page.getByPlaceholder('m@example.com')).toBeVisible();

    await page.getByLabel('Email').fill('legacy@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    // The mocked signInWithPassword session is accepted, so the form is gone.
    await expect(page).not.toHaveURL(/\/login/);
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