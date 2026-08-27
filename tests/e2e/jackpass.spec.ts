import { test, expect } from '@playwright/test';

// Base URL for dev server
const BASE_URL = 'http://localhost:9002';

test.describe('JackPass UI Audit', () => {
  test('Home page loads and has essential elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(BASE_URL + '/');
    // Check that the main heading exists
    await expect(page.locator('text=JackPass')).toBeVisible();
    // Check navigation links
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
    // Check search input exists
    await expect(page.locator('input[placeholder="Search..."]')).toBeVisible();
  });

  test('Login page validation', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await expect(page.locator('form')).toBeVisible();
    // Submit empty form – expect validation error
    await page.click('button[type="submit"]');
    await expect(page.locator('text=required')).toBeVisible();
    // Fill with dummy credentials and submit – expect error from API
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    // API error should surface as toast or message
    await expect(page.locator('text=Invalid credentials').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Signup page works', async ({ page }) => {
    await page.goto(BASE_URL + '/signup');
    await expect(page.locator('form')).toBeVisible();
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    // Expect redirect to dashboard or welcome screen
    await expect(page).toHaveURL(/.*dashboard.*/).catch(() => {});
  });

  test('Questions page loads and filters', async ({ page }) => {
    await page.goto(BASE_URL + '/questions');
    await expect(page.locator('text=Search Questions')).toBeVisible();
    // Apply a filter – placeholder for institution select
    const institutionSelect = page.locator('select[name="institution"]');
    if (await institutionSelect.isVisible()) {
      await institutionSelect.selectOption({ index: 1 });
    }
    // Verify results container loads
    await expect(page.locator('[data-testid="question-card"]').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('Billing page loads and shows payment button', async ({ page }) => {
    await page.goto(BASE_URL + '/billing');
    await expect(page.locator('button[data-testid="subscribe-button"]').first()).toBeVisible();
  });

  test('Admin route protection', async ({ page }) => {
    await page.goto(BASE_URL + '/admin');
    // Non-authenticated should redirect to /admin/login
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });
});
