/**
 * @fileOverview An AI agent that scans an image/document to read visible text and extract structured fields.
 *
 * Uses Hugging Face OCR (baidu/Unlimited-OCR) for text extraction, then
 * Gemini (text-only) for structured metadata extraction.
 *
 * - processQuestionDocument - A function that scans the image content and extracts structured fields.
 * - ProcessQuestionDocumentInput - The input type for the processQuestionDocument function.
 * - ProcessQuestionDocumentOutput - The return type for the processQuestionDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { extractTextFromBase64 } from '@/lib/ocr';
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
 * Parses a data URI into its base64 data and MIME type.
 * Example input: "data:image/jpeg;base64,/9j/4AAQ..."
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

    // If the input is a URL (not a data URI), fetch it first
    if (fileUrl.startsWith('http')) {
        dataUri = await fetchGoogleDriveFileAsDataUri(fileUrl);
    }

    // Step 1: Extract text from the image using Hugging Face OCR
    const { base64, mimeType } = parseDataUri(dataUri);
    console.log(`Running HF OCR on ${mimeType} data...`);

    const ocrResult = await extractTextFromBase64(base64, mimeType);
    const ocrText = ocrResult.text;

    console.log(`HF OCR extracted ${ocrText.length} chars. Extracting metadata with Gemini...`);

    // Step 2: Use Gemini (text-only, no image) to extract structured metadata
    const { output } = await ai.generate({
      prompt: `You are an expert at parsing academic question papers from Nigerian universities.

Given the following OCR-extracted text from a question paper/document, extract the structured metadata.

OCR Text:
${ocrText}

Extract the following:
1. institutionName: The university/institution name
2. courseName: Course name (e.g. "Data Structures and Algorithms", "Engineering Mathematics")
3. examYear: The academic year as a single number (the STARTING year of the session, e.g. 2023 for "2023/2024")
4. semester: "First" or "Second"
5. fullContent: The complete question text exactly as it appears

Rules:
- Only extract information that is clearly present in the text
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, etc.
- If a year range like "2023/2024" is found, use the starting year (2023)
- If semester is not stated, default to "First"
- If course code is present (e.g. "CSC 301"), include it in courseName

Return ONLY valid JSON matching the schema.`,
      output: {
        schema: ProcessQuestionDocumentOutputSchema,
      },
    });

    if (!output) {
      throw new Error('Failed to extract metadata from OCR text');
    }

    return output;
  }
);
