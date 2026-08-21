/**
 * @fileOverview An AI agent that scans an image/document to read visible text and extract structured fields.
 *
 * - processQuestionDocument - A function that scans the image content and extracts structured fields.
 * - ProcessQuestionDocumentInput - The input type for the processQuestionDocument function.
 * - ProcessQuestionDocumentOutput - The return type for the processQuestionDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { RequestInit, Response } from 'node-fetch';

const ProcessQuestionDocumentInputSchema = z.object({
  // A URL or a Data URI
  fileUrl: z.string().describe('The public Google Drive URL or a Data URI of the question paper.'),
});
export type ProcessQuestionDocumentInput = z.infer<typeof ProcessQuestionDocumentInputSchema>;

const ProcessQuestionDocumentOutputSchema = z.object({
  institutionName: z.string().describe('The name of the institution.'),
  courseName: z.string().describe('The name of the course.'),
  examYear: z.number().describe('The year the exam was taken.'),
  semester: z.enum(['First', 'Second']).describe('The semester for the exam.'),
  fullContent: z.string().describe('The full text content extracted from the document.'),
});
export type ProcessQuestionDocumentOutput = z.infer<typeof ProcessQuestionDocumentOutputSchema>;

/**
 * Extracts the Google Drive file ID from a URL.
 * @param url The Google Drive URL.
 * @returns The file ID or null if not found.
 */
function getGoogleDriveFileId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Fetches a file from a public Google Drive link.
 * @param fileUrl The public Google Drive URL.
 * @returns A promise that resolves to the data URI of the file.
 */
async function fetchGoogleDriveFileAsDataUri(fileUrl: string): Promise<string> {
  const fileId = getGoogleDriveFileId(fileUrl);
  if (!fileId) {
    throw new Error('Invalid Google Drive URL. Could not extract file ID.');
  }

  // Use the /gcs/d/ endpoint for more reliable direct downloads of public files.
  const downloadUrl = `https://drive.google.com/gcs/d/${fileId}`;

  // Dynamically import node-fetch
  const fetch = (await import('node-fetch')).default;

  const response: Response = await fetch(downloadUrl, {
    headers: {
        // A user-agent is often required for such requests to succeed.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  return `data:${contentType};base64,${buffer.toString('base64')}`;
}


export async function processQuestionDocument(
  input: ProcessQuestionDocumentInput
): Promise<ProcessQuestionDocumentOutput> {
  return processDocumentFlow(input);
}

const processDocumentFlow = ai.defineFlow(
  {
    name: 'processDocumentFlow',
    inputSchema: ProcessQuestionDocumentInputSchema,
    outputSchema: ProcessQuestionDocumentOutputSchema,
  },
  async ({ fileUrl }) => {
    let dataUri = fileUrl;

    // Check if the input is a URL and not a data URI
    if (fileUrl.startsWith('http')) {
        dataUri = await fetchGoogleDriveFileAsDataUri(fileUrl);
    }
    
    const { output } = await ai.generate({
      prompt: `You are an expert at reading and analyzing exam papers. Scan the image below and read the text visible in it. Extract the required information from what you see in the image.

Document: {{media url="${dataUri}"}}`,
      output: {
        schema: ProcessQuestionDocumentOutputSchema,
      },
    });

    return output!;
  }
);
