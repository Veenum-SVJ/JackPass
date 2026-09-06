import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs as loginAsAdmin } from './helpers/auth';

test.describe('admin analytics', () => {
  test('renders the analytics page with stats, charts, and funnels', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAsAdmin(page);

    await page.goto('/admin/analytics');

    // The recharts bundle is lazy-loaded, so give the first paint extra time.
    await expect(page.getByRole('heading', { name: 'Usage Analytics' })).toBeVisible({ timeout: 20_000 });

    // Stat cards from the mocked overview endpoint (exact — "Sessions" also
    // appears inside funnel step texts like "20 sessions")
    await expect(page.getByText('Sessions', { exact: true })).toBeVisible();
    await expect(page.getByText('Page Views', { exact: true })).toBeVisible();
    await expect(page.getByText('Unique Users', { exact: true })).toBeVisible();
    await expect(page.getByText('120', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('540', { exact: true }).first()).toBeVisible();

    // Charts render as SVG from recharts
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();

    // Top pages + top events from mocked data
    await expect(page.getByRole('heading', { name: 'Top Pages' })).toBeVisible();
    await expect(page.getByText('Library')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top Features Used' })).toBeVisible();
    await expect(page.getByText('Search')).toBeVisible();

    // Funnel section with conversion
    await expect(page.getByRole('heading', { name: 'Conversion Funnels' })).toBeVisible();
    await expect(page.getByText('Upload Flow')).toBeVisible();
    await expect(page.getByText('20 sessions')).toBeVisible();
  });

  test('switches date ranges', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAsAdmin(page);

    await page.goto('/admin/analytics');

    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByRole('button', { name: '7 days' })).toHaveClass(/bg-primary/);

    await page.getByRole('button', { name: '90 days' }).click();
    await expect(page.getByRole('button', { name: '90 days' })).toHaveClass(/bg-primary/);
  });
});