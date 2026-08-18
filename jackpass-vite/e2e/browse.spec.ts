import { test, expect } from '@playwright/test';
import { installMocks, MOCK_QUESTIONS } from './helpers/mocks';

test.describe('browse', () => {
  test('renders the hero and question cards from the API', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Unlock Academic Success' })).toBeVisible();
    await expect(page.getByText('Calculus I')).toBeVisible();
    await expect(page.getByText('Data Structures')).toBeVisible();
    await expect(page.getByText('University of Lagos')).toBeVisible();
    await expect(page.getByText('2023 - First')).toBeVisible();
  });

  test('shows the empty state when there are no questions', async ({ page }) => {
    await installMocks(page, { questions: [] });
    await page.goto('/');

    await expect(page.getByText('No Questions Found')).toBeVisible();
  });

  test('links a question card to its detail page', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await page.getByText('Calculus I').click();
    // The detail endpoint is mocked as 404 → the not-found state renders
    await expect(page.getByRole('heading', { name: 'Question Not Found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  });
});

test.describe('search & filter', () => {
  test('filters by course keyword', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    // The filter matches against the course field (e.g. "MTH 101")
    await page.getByPlaceholder('Course name (e.g. Business Law)').fill('mth');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Calculus I')).toBeVisible();
    await expect(page.getByText('Data Structures')).not.toBeVisible();
  });

  test('filters by institution via the combobox', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await page.getByRole('combobox', { name: 'Select Institution' }).click();
    await page.getByPlaceholder('Search institutions...').fill('ibadan');
    // cmdk auto-highlights the single match — Enter selects it
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Data Structures')).toBeVisible();
    await expect(page.getByText('Calculus I')).not.toBeVisible();
  });

  test('shows "no results" after a filter that matches nothing', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await page.getByPlaceholder('Course name (e.g. Business Law)').fill('quantum physics');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('No Questions Found')).toBeVisible();
  });

  test('resets filters back to the full list', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await page.getByPlaceholder('Course name (e.g. Business Law)').fill('mth');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Data Structures')).not.toBeVisible();

    // Clearing the keyword restores everything once Search is re-applied
    await page.getByPlaceholder('Course name (e.g. Business Law)').fill('');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Calculus I')).toBeVisible();
    await expect(page.getByText('Data Structures')).toBeVisible();
    expect(MOCK_QUESTIONS.length).toBe(2);
  });
});
