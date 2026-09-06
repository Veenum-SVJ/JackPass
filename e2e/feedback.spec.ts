import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs } from './helpers/auth';

test.describe('feedback board', () => {
  test('lists feature requests sorted by votes in the Feedback Board tab', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.goto('/community');
    await page.getByRole('tab', { name: 'Feedback Board' }).click();

    await expect(page.getByText('PDF downloads for past questions')).toBeVisible();
    await expect(page.getByText('Dark mode toggle for the library')).toBeVisible();
    await expect(page.getByText('Request a Feature')).toBeVisible();
    // Both mocked items render with their vote counts
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
  });

  test('upvoting toggles the vote count with a dynamic mock', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    // Override the feedback routes with in-memory state so votes actually change
    let votes = 5;
    let myVote = false;
    await page.route('**/api/feedback', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { item: { id: 'new', title: 'New idea', description: null, category: 'General', status: 'open', user_id: null, created_at: new Date().toISOString(), votes: 0, myVote: false } } });
      }
      return route.fulfill({
        json: {
          items: [
            {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              title: 'PDF downloads for past questions',
              description: null,
              category: 'General',
              status: 'open',
              user_id: null,
              created_at: '2026-08-01T10:00:00.000Z',
              votes,
              myVote,
            },
          ],
        },
      });
    });
    await page.route('**/api/feedback/*/vote', async (route) => {
      myVote = !myVote;
      votes += myVote ? 1 : -1;
      return route.fulfill({ json: { voted: myVote, votes } });
    });

    await page.goto('/community');
    await page.getByRole('tab', { name: 'Feedback Board' }).click();

    const voteButton = page.getByRole('button', { name: /5/ }).first();
    await expect(voteButton).toBeVisible();
    await voteButton.click();

    // List refetches → count is now 6
    await expect(page.getByText('6', { exact: true })).toBeVisible();

    // Toggle again → back to 5
    await page.getByRole('button', { name: /6/ }).first().click();
    await expect(page.getByText('6', { exact: true })).toHaveCount(0);
    await expect(page.getByText('5', { exact: true })).toBeVisible();
  });

  test('creates a feature request', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.goto('/community');
    await page.getByRole('tab', { name: 'Feedback Board' }).click();

    await page.getByPlaceholder('What do you want the app to do? e.g. Past questions in PDF form').fill('Offline reading mode');
    await page.getByRole('button', { name: 'Post Feature Request' }).click();

    await expect(page.getByText('Feature Requested!', { exact: true })).toBeVisible();
  });

  test('shows admin status controls for admins', async ({ page }) => {
    await installMocks(page, { isAdmin: true });
    await loginAs(page);

    await page.goto('/community');
    await page.getByRole('tab', { name: 'Feedback Board' }).click();

    // Admin sees the status dropdown on each item
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });
});