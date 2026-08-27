import { ai } from '../genkit';
import { z } from 'zod';

// Input schema - the raw OCR text
const ExtractQuestionMetadataInputSchema = z.object({
  ocrText: z.string().describe('Raw text extracted from OCR of a question paper/document'),
  filename: z.string().optional().describe('Original filename for context'),
  uploaderId: z.string().describe('ID of the user who uploaded the document'),
});

export type ExtractQuestionMetadataInput = z.infer<typeof ExtractQuestionMetadataInputSchema>;

// Marks allocation for a single part of a question
const MarksPartSchema = z.object({
  label: z.string().describe('Part label like (a), (b), (c) or 1, 2, 3'),
  marks: z.number().describe('Marks allocated to this part'),
  text: z.string().optional().describe('Brief text of this sub-question'),
});

// Marks allocation for a single question
const MarksQuestionSchema = z.object({
  question: z.string().describe('Question number like "1", "2", "3a"'),
  totalMarks: z.number().describe('Total marks for this question'),
  parts: z.array(MarksPartSchema).optional().describe('Sub-parts with individual marks if present'),
});

// Output schema - structured question metadata
const QuestionMetadataSchema = z.object({
  title: z.string().describe('Short descriptive title for the question'),
  institution: z.string().describe('University or institution name'),
  course: z.string().describe('Course code and name'),
  faculty: z.string().optional().describe('Faculty/School'),
  department: z.string().optional().describe('Department'),
  year: z.string().describe('Academic year range (e.g., "2025/2026")'),
  semester: z.enum(['First', 'Second']).describe('Semester: First or Second'),
  type: z.enum(['Objective', 'Theory', 'Mixed']).describe('Question type'),
  contentPreview: z.string().describe('First 200-300 chars of the question content for search results'),
  fullContent: z.string().describe('Complete question text as extracted'),
  answer: z.string().optional().describe('Model answer/solution if present in document'),
  explanation: z.string().optional().describe('Explanation or marking scheme if present'),
  marksScheme: z.array(MarksQuestionSchema).optional().describe('Marks allocation per question/part as printed on the exam paper'),
  answerGenerated: z.string().optional().describe('AI-generated model answer for the questions'),
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

// Genkit flow for scanning text and extracting structured question information
export const extractQuestionMetadataFlow = ai.defineFlow(
  {
    name: 'extractQuestionMetadata',
    inputSchema: ExtractQuestionMetadataInputSchema,
    outputSchema: QuestionMetadataSchema,
  },
  async ({ ocrText, filename, uploaderId: _uploaderId }) => {
    const prompt = `You are an expert at parsing academic question papers from Nigerian universities.

Given the following OCR-extracted text from a question paper/document, extract the structured metadata.

OCR Text:
${ocrText}

${filename ? `Filename: ${filename}` : ''}

Extract the following information as JSON:
1. title: A concise title for this question/set of questions (max 100 chars)
2. institution: The university/institution name
3. course: Course code and name
4. faculty: Faculty/School if mentioned
5. department: Department if mentioned
6. year: The academic year as a range (e.g., "2025/2026")
7. semester: "First" or "Second"
8. type: "Objective" (multiple choice), "Theory" (essay/structured), or "Mixed"
9. contentPreview: First 200-300 chars of actual question content (not metadata)
10. fullContent: The complete question text exactly as it appears
11. answer: The model answer/solution if PROVIDED in the document
12. explanation: Explanation or marking scheme if PROVIDED in the document
13. marksScheme: Extract the marks allocation as printed on the exam paper. For EACH question that shows marks, create an entry with:
    - question: The question number ("1", "2", etc.)
    - totalMarks: Total marks for the question (e.g., 20)
    - parts: Array of sub-parts if the question is divided, each with label ("(a)", "(b)"), marks, and brief text
    Example: If the paper says "Question 1 (20 marks)" with parts (a) 5 marks, (b) 8 marks, (c) 7 marks:
    { "question": "1", "totalMarks": 20, "parts": [{"label":"(a)","marks":5,"text":"Define BST"},{"label":"(b)","marks":8,"text":"Insert algorithm"},{"label":"(c)","marks":7,"text":"Time complexity"}] }
    If no marks are visible, set marksScheme to an empty array [].
14. answerGenerated: Generate a MODEL ANSWER for ALL questions combined. Write a comprehensive answer that a top-scoring student would write. For theory questions, structure your answer to address each sub-part. For objective questions, provide the correct option with explanation.
15. confidence: Confidence scores (0.0-1.0) for each field

Rules:
- Only extract metadata that is clearly present in the text
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, etc.
- Course codes follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If information is ambiguous, set lower confidence and make reasonable inference
- marksScheme should capture ALL marks information visible on the paper
- answerGenerated should be thorough and demonstrate subject knowledge

Return ONLY valid JSON matching the schema.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: QuestionMetadataSchema },
      config: { temperature: 0.2 },
    });

    if (!output) {
      throw new Error('AI failed to extract metadata');
    }

    return output;
  }
);

// Separate flow for regenerating just the AI answer (no re-extraction needed)
const GenerateAnswerInputSchema = z.object({
  fullContent: z.string().describe('The full question text'),
  marksScheme: z.array(MarksQuestionSchema).optional().describe('Marks allocation if available'),
});

const GenerateAnswerOutputSchema = z.object({
  answer: z.string().describe('AI-generated model answer'),
  explanation: z.string().optional().describe('Step-by-step explanation of the answer'),
});

export const generateAnswerFlow = ai.defineFlow(
  {
    name: 'generateAnswer',
    inputSchema: GenerateAnswerInputSchema,
    outputSchema: GenerateAnswerOutputSchema,
  },
  async ({ fullContent, marksScheme }) => {
    const marksContext = marksScheme && marksScheme.length > 0
      ? `\n\nMarks allocation:\n${JSON.stringify(marksScheme, null, 2)}\n\nStructure your answer to address each sub-part and note how many marks each section is worth.`
      : '';

    const prompt = `You are an expert academic tutor specializing in Nigerian university courses.

Given the following exam questions, write a comprehensive model answer that a top-scoring student would submit.

Questions:
${fullContent}
${marksContext}

Rules:
- Answer ALL questions thoroughly
- For theory questions: provide detailed explanations with examples where appropriate
- For objective/MCQ questions: state the correct option and explain why
- If marks are allocated, ensure your answer addresses each part and matches the marks weight
- Use clear formatting with question numbers and sub-parts
- Be accurate and academically rigorous
- For the explanation field, provide a step-by-step walkthrough of how to arrive at the answer

Return ONLY valid JSON matching the schema.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: GenerateAnswerOutputSchema },
      config: { temperature: 0.3 },
    });

    if (!output) {
      throw new Error('AI failed to generate answer');
    }

    return output;
  }
);
