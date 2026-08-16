'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema - the raw OCR text
const ExtractQuestionMetadataInputSchema = z.object({
  ocrText: z.string().describe('Raw text extracted from OCR of a question paper/document'),
  filename: z.string().optional().describe('Original filename for context'),
  uploaderId: z.string().describe('ID of the user who uploaded the document'),
});

export type ExtractQuestionMetadataInput = z.infer<typeof ExtractQuestionMetadataInputSchema>;

// Output schema - structured question metadata
const QuestionMetadataSchema = z.object({
  title: z.string().describe('Short descriptive title for the question (e.g., "Binary Search Tree Operations")'),
  institution: z.string().describe('University or institution name (e.g., "University of Lagos")'),
  course: z.string().describe('Course code and name (e.g., "CSC 301 - Data Structures and Algorithms")'),
  faculty: z.string().optional().describe('Faculty/School (e.g., "Faculty of Science")'),
  department: z.string().optional().describe('Department (e.g., "Computer Science")'),
  year: z.number().int().min(1990).max(new Date().getFullYear()).describe('Academic year (e.g., 2023)'),
  semester: z.enum(['First', 'Second']).describe('Semester: First or Second'),
  type: z.enum(['Objective', 'Theory', 'Mixed']).describe('Question type: Objective (MCQ), Theory (essay), or Mixed'),
  contentPreview: z.string().describe('First 200-300 chars of the question content for search results'),
  fullContent: z.string().describe('Complete question text as extracted'),
  answer: z.string().optional().describe('Model answer/solution if present in document'),
  explanation: z.string().optional().describe('Explanation or marking scheme if present'),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    institution: z.number().min(0).max(1),
    course: z.number().min(0).max(1),
    year: z.number().min(0).max(1),
    semester: z.number().min(0).max(1),
    type: z.number().min(0).max(1),
  }).describe('Confidence scores for each extracted field (0-1)'),
});

export type QuestionMetadata = z.infer<typeof QuestionMetadataSchema>;

// Genkit flow for extracting question metadata from OCR text
export const extractQuestionMetadataFlow = ai.defineFlow(
  {
    name: 'extractQuestionMetadata',
    inputSchema: ExtractQuestionMetadataInputSchema,
    outputSchema: QuestionMetadataSchema,
  },
  async ({ ocrText, filename, uploaderId }) => {
    // Use the AI model to extract structured metadata
    const prompt = `You are an expert at parsing academic question papers from Nigerian universities.

Given the following OCR-extracted text from a question paper/document, extract the structured metadata.

OCR Text:
${ocrText}

${filename ? `Filename: ${filename}` : ''}

Extract the following information as JSON:
1. title: A concise title for this question/set of questions (max 100 chars)
2. institution: The university/institution name (e.g., "University of Lagos", "UNILAG", "Federal University of Technology Owerri")
3. course: Course code and name (e.g., "CSC 301 - Data Structures", "MTH 201 - Calculus", "PHY 101 - General Physics")
4. faculty: Faculty/School if mentioned (e.g., "Faculty of Science", "School of Engineering")
5. department: Department if mentioned (e.g., "Computer Science", "Mathematics", "Physics")
6. year: The academic year (e.g., 2023, 2022). If not explicitly stated, infer from context or use current year.
7. semester: "First" or "Second" semester. If not stated, default to "First".
8. type: "Objective" (multiple choice), "Theory" (essay/structured questions), or "Mixed"
9. contentPreview: First 200-300 characters of the actual question content (not metadata)
10. fullContent: The complete question text exactly as it appears
11. answer: The model answer/solution if provided in the document
11. explanation: Explanation, marking scheme, or worked solutions if provided
12. confidence: Confidence scores (0.0-1.0) for each field based on how clearly it appears in the text

Rules:
- Only extract information that is clearly present in the text
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, etc.
- Course codes typically follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If information is ambiguous, set lower confidence and make reasonable inference
- The contentPreview should be the actual question, not the metadata header

Return ONLY valid JSON matching the schema.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: QuestionMetadataSchema },
      config: { temperature: 0.1 }, // Low temperature for consistent extraction
    });

    if (!output) {
      throw new Error('AI failed to extract metadata');
    }

    return output;
  }
);