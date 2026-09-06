import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs } from './helpers/auth';

const MOCK_POSTS = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    user_id: null,
    title: 'Anyone have the MTH 101 past questions from 2022?',
    description: "I've been searching everywhere for the 2022 MTH 101 past questions. Can anyone help me out?",
    category: 'Past Questions Requests',
    university: 'University of Lagos',
    course: 'MTH 101',
    created_at: '2026-07-15T10:00:00.000Z',
    author: 'John Doe',
    votes: 12,
    replies: 5,
    myVote: false,
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    user_id: null,
    title: 'Struggling with CSC 404 (Advanced Algorithms)',
    description: 'Does anyone have tips or resources for the final exams?',
    category: 'Course Help',
    university: 'University of Ibadan',
    course: 'CSC 404',
    created_at: '2026-07-14T10:00:00.000Z',
    author: 'Jane Smith',
    votes: 25,
    replies: 12,
    myVote: false,
  },
];

test.describe('community forum', () => {
  test('lists recent discussions fetched from the forum backend', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.goto('/community');

    await expect(page.getByText('Anyone have the MTH 101 past questions from 2022?')).toBeVisible();
    await expect(page.getByText('Struggling with CSC 404 (Advanced Algorithms)')).toBeVisible();
    await expect(page.getByText('5 replies', { exact: true })).toBeVisible();
    // Vote counts render on each post's upvote button
    await expect(page.getByRole('button', { name: '12' })).toBeVisible();
    await expect(page.getByRole('button', { name: '25' })).toBeVisible();
  });

  test('clicking a category card filters the list', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.goto('/community');

    await page.getByText('Course Help', { exact: true }).first().click();

    await expect(page.getByText('Struggling with CSC 404 (Advanced Algorithms)')).toBeVisible();
    await expect(page.getByText('Anyone have the MTH 101 past questions from 2022?')).toHaveCount(0);
  });

  test('upvoting toggles the vote count with a dynamic mock', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    let votes = 12;
    let myVote = false;
    await page.route('**/api/forum', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { post: MOCK_POSTS[0] } });
      }
      return route.fulfill({
        json: { posts: [{ ...MOCK_POSTS[0], votes, myVote }] },
      });
    });
    await page.route('**/api/forum/*/vote', async (route) => {
      myVote = !myVote;
      votes += myVote ? 1 : -1;
      return route.fulfill({ json: { voted: myVote, votes } });
    });

    await page.goto('/community');

    const voteButton = page.getByRole('button', { name: '12' });
    await expect(voteButton).toBeVisible();
    await voteButton.click();

    // List refetches → count is now 13
    await expect(page.getByRole('button', { name: '13' })).toBeVisible();

    // Toggle again → back to 12
    await page.getByRole('button', { name: '13' }).click();
    await expect(page.getByRole('button', { name: '12' })).toBeVisible();
  });

  test('creates a new discussion post through the dialog', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.goto('/community');

    await page.getByRole('button', { name: 'Create New Post' }).click();
    await page.getByPlaceholder('What is your post about?').fill('Study group for GNS 101 finals');
    await page.getByPlaceholder('Share more details here...').fill('Looking for students to revise for the upcoming GNS 101 exams together.');
    await page.getByRole('button', { name: 'Create Post' }).click();

    await expect(page.getByText('Post Created!', { exact: true })).toBeVisible();
  });
});
