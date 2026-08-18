import { createServerSupabase } from './supabase-server';
import { extractTextFromFile } from './ocr';
import { v4 as uuidv4 } from 'uuid';
import { processUploadedQuestionFlow } from '@/ai/flows/process-uploaded-question';

/**
 * Process an uploaded file: store in Supabase Storage, run OCR asynchronously, save metadata.
 */
export async function processQuestionUpload(
  file: File,
  uploaderId: string,
  _metadata: {
    title?: string;
    institution?: string;
    course?: string;
    year?: number;
    semester?: 'First' | 'Second';
    type?: 'Objective' | 'Theory' | 'Mixed';
  } = {}
) {
  const supabase = createServerSupabase();

  // Generate unique file name for storage
  const fileExt = file.name.split('.').pop();
  const storageFileName = `${uploaderId}/${uuidv4()}.${fileExt}`;

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('question-files')
    .upload(storageFileName, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('question-files')
    .getPublicUrl(storageFileName);

  const fileUrl = urlData.publicUrl;

  // 2. Create initial upload record with "uploading" status
  // OCR will be processed asynchronously after this returns
  const uploadRecord = {
    id: uuidv4(),
    uploader_id: uploaderId,
    file_name: file.name,
    file_url: fileUrl,
    file_type: file.type,
    file_size: file.size,
    upload_status: 'uploading' as const,
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: new Date().toISOString(),
    processed_at: null
  };

  const { data: uploadRecordData, error: uploadRecordError } = await supabase
    .from('question_uploads')
    .insert([uploadRecord])
    .select()
    .single();

  if (uploadRecordError) {
    // If DB insert fails, clean up the uploaded file
    await supabase.storage.from('question-files').remove([storageFileName]);
    throw new Error(`Failed to save upload record: ${uploadRecordError.message}`);
  }

  // 3. Process OCR asynchronously (non-blocking)
  // We don't await this - it runs in the background
  processOcrAsync(uploadRecordData.id, file, storageFileName);

  // 4. Return immediately with upload info
  return {
    upload: uploadRecordData,
    ocrText: null, // OCR still processing
    ocrConfidence: null,
    fileUrl
  };
}

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

/**
 * Asynchronously process OCR and update the upload record, then trigger AI extraction
 */
async function processOcrAsync(uploadId: string, file: File, _storageFileName: string) {
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

    // Get uploader ID from upload record for AI flow
    const { data: uploadRecord } = await supabase
      .from('question_uploads')
      .select('uploader_id')
      .eq('id', uploadId)
      .single();

    // Trigger AI metadata extraction (async, don't block)
    // Only process if substantial text extracted
    if (ocrText.length > 50) {
      const uploaderId = uploadRecord?.uploader_id || 'unknown';

      // Fire and forget - don't await
      processUploadedQuestionFlow({
        uploadId,
        ocrText,
        filename: file.name,
        uploaderId,
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

/**
 * Helper to get upload status
 */
export async function getUploadStatus(uploadId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('question_uploads')
    .select('*')
    .eq('id', uploadId)
    .single();

  if (error) throw error;
  return data;
}