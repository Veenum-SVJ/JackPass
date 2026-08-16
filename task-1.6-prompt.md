## Task 1.6: AI Metadata Extraction Pipeline (Genkit Flow)
Goal: Create a Genkit flow that takes OCR-extracted text and automatically extracts structured metadata (institution, course, year, semester, question type, content preview, full content, answer, explanation) to create a pending question record.

### Files to Create/Modify
- Create: `src/ai/flows/extract-question-metadata.ts` — Genkit flow for metadata extraction
- Create: `src/ai/flows/process-uploaded-question.ts` — Complete pipeline: OCR text → AI extraction → question creation
- Modify: `src/lib/upload.ts` — Add trigger for AI processing after OCR completes
- Modify: `src/ai/genkit.ts` — Ensure proper Genkit configuration

### Exact Code to Write

```typescript
// src/ai/flows/extract-question-metadata.ts
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
```

```typescript
// src/ai/flows/process-uploaded-question.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { extractQuestionMetadataFlow } from './extract-question-metadata';
import { createServerSupabase } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

const ProcessUploadedQuestionInputSchema = z.object({
  uploadId: z.string().uuid(),
  ocrText: z.string(),
  filename: z.string().optional(),
  uploaderId: z.string(),
});

export type ProcessUploadedQuestionInput = z.infer<typeof ProcessUploadedQuestionInputSchema>;

const ProcessUploadedQuestionOutputSchema = z.object({
  success: z.boolean(),
  questionId: z.string().optional(),
  uploadId: z.string(),
  error: z.string().optional(),
  metadata: z.any().optional(),
});

export type ProcessUploadedQuestionOutput = z.infer<typeof ProcessUploadedQuestionOutputSchema>;

export const processUploadedQuestionFlow = ai.defineFlow(
  {
    name: 'processUploadedQuestion',
    inputSchema: ProcessUploadedQuestionInputSchema,
    outputSchema: ProcessUploadedQuestionOutputSchema,
  },
  async ({ uploadId, ocrText, filename, uploaderId }) => {
    const supabase = createServerSupabase();

    try {
      // Step 1: Extract metadata using AI
      console.log(`Starting AI metadata extraction for upload ${uploadId}`);
      
      const metadata = await extractQuestionMetadataFlow({
        ocrText,
        filename,
        uploaderId,
      });

      console.log(`Metadata extracted for upload ${uploadId}:`, {
        institution: metadata.institution,
        course: metadata.course,
        year: metadata.year,
        type: metadata.type,
      });

      // Step 2: Get the file URL from uploads table
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('question_uploads')
        .select('file_url, file_name')
        .eq('id', uploadId)
        .single();

      if (uploadError || !uploadRecord) {
        throw new Error(`Upload record not found: ${uploadError?.message}`);
      }

      // Step 3: Create the question record in 'pending' status
      const questionData = {
        id: uuidv4(),
        title: metadata.title,
        institution: metadata.institution,
        course: metadata.course,
        faculty: metadata.faculty,
        department: metadata.department,
        year: metadata.year,
        semester: metadata.semester,
        type: metadata.type,
        status: 'pending' as const,
        content_preview: metadata.contentPreview,
        full_content: metadata.fullContent,
        answer: metadata.answer,
        explanation: metadata.explanation,
        file_url: uploadRecord.file_url,
        file_name: uploadRecord.file_name,
        file_type: uploadRecord.file_name.split('.').pop() || 'unknown',
        uploader_id: uploaderId,
        ai_extracted_data: metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();

      if (questionError) {
        throw new Error(`Failed to create question: ${questionError.message}`);
      }

      // Step 4: Update upload record with question_id and mark as processed
      await supabase
        .from('question_uploads')
        .update({
          question_id: question.id,
          upload_status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', uploadId);

      console.log(`Question created successfully: ${question.id} from upload ${uploadId}`);

      return {
        success: true,
        questionId: question.id,
        uploadId,
        metadata,
      };
    } catch (error) {
      console.error(`Failed to process uploaded question ${uploadId}:`, error);

      // Update upload status to failed
      await supabase
        .from('question_uploads')
        .update({
          upload_status: 'failed',
          ocr_text: `AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', uploadId);

      return {
        success: false,
        uploadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);
```

```typescript
// src/lib/upload.ts (add at the end of the file)
import { processUploadedQuestionFlow } from '@/ai/flows/process-uploaded-question';

/**
 * Trigger AI metadata extraction after OCR completes
 * Called from processOcrAsync when OCR is successful
 */
export async function triggerAIExtraction(
  uploadId: string,
  ocrText: string,
  filename?: string,
  uploaderId?: string
) {
  try {
    console.log(`Triggering AI extraction for upload ${uploadId}`);
    
    const result = await processUploadedQuestionFlow({
      uploadId,
      ocrText,
      filename,
      uploaderId: uploaderId || 'unknown',
    });

    return result;
  } catch (error) {
    console.error(`AI extraction trigger failed for ${uploadId}:`, error);
    return { success: false, error: String(error) };
  }
}
```

```typescript
// src/ai/flows/extract-question-metadata.ts (add to exports)
export { extractQuestionMetadataFlow };
```

```typescript
// src/ai/flows/process-uploaded-question.ts (add to exports)
export { processUploadedQuestionFlow };
```

```typescript
// Modify src/ai/flows/index.ts (or create if not exists) to export flows
export { extractQuestionMetadataFlow } from './extract-question-metadata';
export { processUploadedQuestionFlow } from './process-uploaded-question';
```

```typescript
// Modify src/lib/upload.ts - update processOcrAsync to call AI extraction
// Replace the processOcrAsync function with:

/**
 * Asynchronously process OCR and update the upload record, then trigger AI extraction
 */
async function processOcrAsync(uploadId: string, file: File, storageFileName: string) {
  const supabase = createServerSupabase();

  try {
    // Update status to "processing"
    await supabase
      .from('question_uploads')
      .update({ upload_status: 'processing' as const })
      .eq('id', uploadId);

    // Run OCR
    const { text: ocrText, confidence: ocrConfidence } = await extractTextFromFile(file);

    // Update record with OCR results
    const { error: updateError } = await supabase
      .from('question_uploads')
      .update({
        upload_status: 'processed' as const,
        ocr_text: ocrText,
        ocr_confidence: JSON.stringify(ocrConfidence),
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    if (updateError) {
      console.error('Failed to update upload record with OCR results:', updateError);
    }

    console.log(`OCR completed for upload ${uploadId}`);

    // Get uploader ID for AI flow
    const { data: uploadRecord } = await supabase
      .from('question_uploads')
      .select('uploader_id') // We'll need to add this column or get from file path
      .eq('id', uploadId)
      .single();

    // TODO: Get actual uploaderId - for now we'll need to pass it through
    // Trigger AI metadata extraction (async, don't block)
    // Note: We need the uploaderId - we'll add it to the upload record
    if (uploadRecord && ocrText.length > 50) { // Only process if substantial text
      // Fire and forget - don't await
      processUploadedQuestionFlow({
        uploadId,
        ocrText,
        filename: file.name,
        uploaderId: uploadRecord.uploader_id || 'unknown',
      }).catch(err => console.error('AI extraction failed:', err));
    }

  } catch (error) {
    console.error('OCR processing failed:', error);

    // Mark upload as failed
    await supabase
      .from('question_uploads')
      .update({
        upload_status: 'failed' as const,
        ocr_text: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);
  }
}
```

### Commands to Run & Expected Output
```bash
# 1. Ensure GOOGLE_AI_API_KEY is set in .env.local (from Google AI Studio)
# 2. Run typecheck and lint
npm run typecheck
npm run lint

# 3. Test the flow manually (need a real Supabase JWT)
# First upload a file to get an uploadId, then:
# curl -X POST http://localhost:9002/api/admin/process-question \
#   -H "Authorization: Bearer <jwt>" \
#   -H "Content-Type: application/json" \
#   -d '{"uploadId": "...", "ocrText": "...", "filename": "sample.pdf"}'

# Or test via the Genkit dev UI:
npm run genkit:dev
# Open http://localhost:4000 to test flows interactively
```

### Acceptance Criteria
- [ ] `src/ai/flows/extract-question-metadata.ts` extracts structured metadata from OCR text
- [ ] `src/ai/flows/process-uploaded-question.ts` orchestrates OCR→AI→Question creation
- [ ] Genkit flows are properly typed with Zod schemas
- [ ] AI extraction creates pending question records with all metadata fields
- [ ] Upload record is linked to created question via question_id
- [ ] TypeScript check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

### Error Handling
- If AI extraction fails: mark upload as failed, log error, don't crash
- If question creation fails: rollback upload status, notify user
- Low confidence fields: still create question but flag for admin review
- PDF text too short: skip AI extraction, require manual entry

### Future Improvements
1. Add human-in-the-loop review for low-confidence extractions
2. Implement duplicate detection (similarity search on question content)
3. Add batch processing for multiple uploads
4. Implement feedback loop to improve extraction prompts

### Git Commit Message
feat: add AI metadata extraction pipeline with Genkit flows for automated question creation