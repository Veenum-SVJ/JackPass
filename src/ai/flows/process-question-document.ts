/**
 * @fileOverview An AI agent that scans an image/document to read visible text and extract structured fields.
 *
 * Uses Gemini 3.6 Flash vision capability to both read the text AND extract
 * structured metadata in a single API call. The image is compressed client-side
 * before being sent, so the payload is small enough for Gemini.
 *
 * - processQuestionDocument - A function that scans the image content and extracts structured fields.
 * - ProcessQuestionDocumentInput - The input type for the processQuestionDocument function.
 * - ProcessQuestionDocumentOutput - The return type for the processQuestionDocument function.
 */

import { ai } from '../genkit';
import { z } from 'zod';
import type { RequestInit, Response } from 'node-fetch';

const ProcessQuestionDocumentInputSchema = z.object({
  // A URL or a Data URI
  fileUrl: z.string().describe('The public Google Drive URL or a Data URI of the question paper.'),
});
export type ProcessQuestionDocumentInput = z.infer<typeof ProcessQuestionDocumentInputSchema>;

const ProcessQuestionDocumentOutputSchema = z.object({
  institutionName: z.string().describe('The full name of the institution.'),
  courseName: z.string().describe('The name of the course without the code, e.g. "Data Structures and Algorithms"'),
  courseCode: z.string().optional().describe('The course code if present, e.g. "CSC 301"'),
  examYear: z.number().describe('The year the exam was taken.'),
  semester: z.enum(['First', 'Second']).describe('The semester for the exam.'),
  fullContent: z.string().describe('The full text content extracted from the document.'),
});
export type ProcessQuestionDocumentOutput = z.infer<typeof ProcessQuestionDocumentOutputSchema>;

/**
 * Parses a data URI into its base64 data and MIME type.
 */
function parseDataUri(dataUri: string): { base64: string; mimeType: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid data URI format');
  }
  return { mimeType: match[1], base64: match[2] };
}

/**
 * Extracts the Google Drive file ID from a URL.
 */
function getGoogleDriveFileId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

/**
 * Fetches a file from a public Google Drive link.
 */
async function fetchGoogleDriveFileAsDataUri(fileUrl: string): Promise<string> {
  const fileId = getGoogleDriveFileId(fileUrl);
  if (!fileId) {
    throw new Error('Invalid Google Drive URL. Could not extract file ID.');
  }

  const downloadUrl = `https://drive.google.com/gcs/d/${fileId}`;
  const fetch = (await import('node-fetch')).default;

  const response: Response = await fetch(downloadUrl, {
    headers: {
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

    // If the input is a URL (not a data URI), fetch it first
    if (fileUrl.startsWith('http')) {
        dataUri = await fetchGoogleDriveFileAsDataUri(fileUrl);
    }

    // Parse the data URI to get the image data and MIME type
    const { base64, mimeType } = parseDataUri(dataUri);
    console.log(`Sending image to Gemini vision (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)...`);

    const startTime = Date.now();

    // Use Gemini vision to read the image AND extract metadata in one call
    const { output } = await ai.generate({
      prompt: [
        {
          text: `Extract structured metadata from this academic question paper image.

Read the image carefully and return:
- institutionName: The full university/institution name (e.g. "University of Lagos")
- courseName: Course name WITHOUT the code (e.g. "Data Structures and Algorithms")
- courseCode: The course code if visible (e.g. "CSC 301")
- examYear: The starting year as a number (e.g. 2023 for "2023/2024")
- semester: "First" or "Second"
- fullContent: ALL text visible in the image, transcribed exactly as it appears

Rules:
- Transcribe text faithfully from the image — do not guess or fabricate
- For Nigerian universities, recognize abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- If year range like "2023/2024", use starting year (2023)
- If semester not stated, default to "First"
- Return ONLY valid JSON matching the schema`,
        },
        {
          media: {
            url: `data:${mimeType};base64,${base64}`,
          },
        },
      ],
      output: {
        schema: ProcessQuestionDocumentOutputSchema,
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`Gemini responded in ${elapsed}ms: institution=${output?.institutionName}, course=${output?.courseName}, code=${output?.courseCode}`);

    if (!output) {
      throw new Error('Failed to extract metadata from document image');
    }

    return output;
  }
);
