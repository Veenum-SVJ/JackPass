'use server';

/**
 * @fileOverview An AI agent that extracts institution and course names from an image of a past question paper.
 *
 * - extractQuestionMetadata - A function that handles the metadata extraction process.
 * - ExtractQuestionMetadataInput - The input type for the extractQuestionMetadata function.
 * - ExtractQuestionMetadataOutput - The return type for the extractQuestionMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractQuestionMetadataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a past question paper, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractQuestionMetadataInput = z.infer<
  typeof ExtractQuestionMetadataInputSchema
>;

const ExtractQuestionMetadataOutputSchema = z.object({
  institutionName: z.string().describe('The name of the institution.'),
  courseName: z.string().describe('The name of the course.'),
});
export type ExtractQuestionMetadataOutput = z.infer<
  typeof ExtractQuestionMetadataOutputSchema
>;

export async function extractQuestionMetadata(
  input: ExtractQuestionMetadataInput
): Promise<ExtractQuestionMetadataOutput> {
  return extractQuestionMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractQuestionMetadataPrompt',
  input: {schema: ExtractQuestionMetadataInputSchema},
  output: {schema: ExtractQuestionMetadataOutputSchema},
  prompt: `You are an expert at extracting the institution and course name from a past question paper.

  Analyze the image and extract the institution name and course name. Only suggest the institutions and courses already added to the database.

  Image: {{media url=photoDataUri}}
  `,
});

const extractQuestionMetadataFlow = ai.defineFlow(
  {
    name: 'extractQuestionMetadataFlow',
    inputSchema: ExtractQuestionMetadataInputSchema,
    outputSchema: ExtractQuestionMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
