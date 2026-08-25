import { ai } from '../genkit';
import { z } from 'zod';
import { extractQuestionMetadataFlow } from './extract-question-metadata';
import { createServerSupabase } from '../../lib/supabase-server';
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