import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs as loginAsAdmin } from './helpers/auth';

test.describe('Weekly email digest (admin)', () => {
  test('digest card is visible on the analytics page', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAsAdmin(page);

    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Usage Analytics' })).toBeVisible({ timeout: 20_000 });

    // The digest section sits at the bottom of the page
    const card = page.getByRole('button', { name: 'Send test digest now' });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    await expect(page.getByText('Every Monday 08:00 UTC')).toBeVisible();
  });

  test('send test digest shows a success toast', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAsAdmin(page);

    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Usage Analytics' })).toBeVisible({ timeout: 20_000 });

    const button = page.getByRole('button', { name: 'Send test digest now' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(page.getByText('Digest sent')).toBeVisible({ timeout: 10_000 });
  });
});
