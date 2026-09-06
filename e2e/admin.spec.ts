import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs } from './helpers/auth';

test.describe('admin route guards', () => {
  test('redirects signed-out users to the admin login page', async ({ page }) => {
    await installMocks(page);
    await page.goto('/admin/questions');

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByText('Sign in with your JackPass account.')).toBeVisible();
  });

  test('blocks non-admin users with an access denied toast', async ({ page }) => {
    await installMocks(page, { isAdmin: false });
    await loginAs(page);

    await page.goto('/admin/questions');

    await expect(page).toHaveURL(/\/admin\/login\?error=not_admin/);
    await expect(page.getByText('Access Denied', { exact: true })).toBeVisible();
  });

  test('allows admin users to reach the moderation view', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAs(page);

    await page.goto('/admin/questions');

    await expect(page.getByRole('heading', { name: 'Exam Paper Moderation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Exam Papers' })).toBeVisible();
  });
});

test.describe('question moderation', () => {
  test('renders question cards with status badges and AI confidence', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAs(page);
    await page.goto('/admin/questions');

    // Default status filter is "pending" → only the pending question renders
    await expect(page.getByText('Organic Chemistry Reactions')).toBeVisible();
    await expect(page.getByText('Thermodynamics Laws')).toBeHidden();
    // Status badge on the pending card (the status-filter <option> also has
    // this text but is hidden, so match the badge div directly)
    await expect(page.locator('div', { hasText: /^Pending$/ })).toBeVisible();
    // AI confidence from the seeded ai_extracted_data
    await expect(page.getByText('92%', { exact: true }).first()).toBeVisible();

    // Switch the filter to all statuses → both seeded questions render
    await page.getByRole('combobox').first().selectOption('all');
    await expect(page.getByText('Thermodynamics Laws')).toBeVisible();
    // Institution filter populated from the mocked endpoint (options in a
    // closed <select> are hidden, so assert presence rather than visibility)
    await expect(page.getByRole('option', { name: 'University of Lagos' })).toHaveCount(1);
    await expect(page.getByRole('option', { name: 'University of Ibadan' })).toHaveCount(1);
  });

  test('approves a pending question', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAs(page);
    await page.goto('/admin/questions');

    // Only one seeded question is pending → exactly one Approve button
    await page.getByRole('button', { name: 'Approve', exact: true }).click();

    await expect(page.getByText('Exam Paper Approved', { exact: true })).toBeVisible();
  });

  test('rejects a pending question', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAs(page);
    await page.goto('/admin/questions');

    await page.getByRole('button', { name: 'Reject', exact: true }).click();

    await expect(page.getByText('Exam Paper Rejected', { exact: true })).toBeVisible();
  });
});
