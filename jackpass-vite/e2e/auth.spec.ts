import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';

test.describe('login', () => {
  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();
  });

  test('shows an error toast for invalid credentials', async ({ page }) => {
    await installMocks(page);
    // Override the token endpoint AFTER installMocks so this route wins
    await page.route('**/auth/v1/token*', (route) =>
      route.fulfill({
        status: 400,
        json: { error: 'invalid_grant', error_description: 'Invalid login credentials' },
      })
    );

    await page.goto('/login');
    await page.getByPlaceholder('m@example.com').fill('student@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page.getByText('Login Failed', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logs in successfully and redirects to the home page', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    await page.getByPlaceholder('m@example.com').fill('student@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page.getByText('Login Successful!', { exact: true })).toBeVisible();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Unlock Academic Success' })).toBeVisible();
  });

  test('toggles password visibility', async ({ page }) => {
    await installMocks(page);
    await page.goto('/login');

    const password = page.getByLabel('Password');
    await password.fill('secret123');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });
});

test.describe('signup', () => {
  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await installMocks(page);
    await page.goto('/signup');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Name must be at least 2 characters.')).toBeVisible();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('signs up successfully and redirects to login', async ({ page }) => {
    await installMocks(page);
    await page.goto('/signup');

    await page.getByPlaceholder('John Doe').fill('Test Student');
    await page.getByPlaceholder('m@example.com').fill('student@example.com');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Account Created!', { exact: true })).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('route guards', () => {
  test('redirects signed-out users away from protected pages', async ({ page }) => {
    await installMocks(page);
    await page.goto('/profile');

    await expect(page).toHaveURL(/\/login$/);
    // The login card renders (CardTitle is a div, not a heading)
    await expect(page.getByText('Enter your email below to login to your account.')).toBeVisible();
  });

  test('redirects signed-out users away from billing', async ({ page }) => {
    await installMocks(page);
    await page.goto('/billing');

    await expect(page).toHaveURL(/\/login$/);
  });
});
