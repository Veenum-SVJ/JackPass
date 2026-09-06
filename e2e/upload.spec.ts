import { test, expect } from '@playwright/test';
import { installMocks } from './helpers/mocks';
import { loginAs } from './helpers/auth';

test.describe('upload flow', () => {
  test('signed-out users are asked to log in when clicking upload', async ({ page }) => {
    await installMocks(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Upload Exam Paper' }).click();

    await expect(page.getByText('Authentication Required', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('opens the upload dialog for signed-in users', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.getByRole('button', { name: 'Upload Exam Paper' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Upload Exam Paper' })).toBeVisible();
    await expect(dialog.getByText('Upload File(s)')).toBeVisible();
    await expect(dialog.getByText('Import from Link')).toBeVisible();
  });

  test('validates that a file or link is required', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.getByRole('button', { name: 'Upload Exam Paper' }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByRole('button', { name: 'Submit for Review' }).click();

    await expect(dialog.getByText('Either a file or a URL must be provided.')).toBeVisible();
    await expect(dialog.getByText('Please select an institution.')).toBeVisible();
  });

  test('uploads a file end-to-end with mocked AI metadata extraction', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.getByRole('button', { name: 'Upload Exam Paper' }).click();
    const dialog = page.getByRole('dialog');

    // Select a file → triggers the mocked AI document processing
    await page.setInputFiles('#file-upload', {
      name: 'mth101-past-question.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nmock past question paper'),
    });

    // AI extraction (mocked) pre-fills the metadata fields (toast renders in
    // the root toaster, outside the dialog)
    await expect(page.getByText('Image Scanned!', { exact: true })).toBeVisible();

    const submit = dialog.getByRole('button', { name: 'Submit for Review' });
    await expect(submit).toBeEnabled();
    await submit.click();

    // Upload (mocked) succeeds → toast + dialog closes
    await expect(page.getByText('Upload Successful!', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('imports metadata from a Google Drive link', async ({ page }) => {
    await installMocks(page);
    await loginAs(page);

    await page.getByRole('button', { name: 'Upload Exam Paper' }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByText('Import from Link').click();
    await dialog.getByPlaceholder('Paste public Google Drive link here').fill('https://drive.google.com/file/d/abc123/view');
    await dialog.getByRole('button', { name: 'Process' }).click();

    // The mocked AI response pre-fills the form (toast renders at the root)
    await expect(page.getByText('Document Processed!', { exact: true })).toBeVisible();
    await expect(dialog.getByPlaceholder('e.g., Engineering Mathematics')).toHaveValue('MTH 101');
  });
});
