import { createServerSupabase } from './supabase-server';
import { extractTextFromFile } from './ocr';
import { v4 as uuidv4 } from 'uuid';
import { processUploadedQuestionFlow } from '../ai/flows/process-uploaded-question';

/**
 * Process an uploaded file: store in Supabase Storage, run OCR asynchronously, save metadata.
 */
export async function processQuestionUpload(
  file: File,
  uploaderId: string,
  metadata: {
    title?: string;
    institution?: string;
    course?: string;
    courseCode?: string;
    year?: string;
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

  // 3. Process OCR synchronously so it completes within the serverless timeout
  try {
    await processOcrSync(uploadRecordData.id, file, storageFileName, metadata);
  } catch (ocrError) {
    console.error('OCR processing failed (non-fatal):', ocrError);
  }

  // 4. Return with upload info
  return {
    upload: uploadRecordData,
    ocrText: null,
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
  uploaderId?: string,
  metadata?: {
    institution?: string;
    course?: string;
    courseCode?: string;
    year?: string;
    semester?: 'First' | 'Second';
  }
) {
  try {
    console.log(`Triggering AI extraction for upload ${uploadId}`);

    const result = await processUploadedQuestionFlow({
      uploadId,
      ocrText,
      filename,
      uploaderId: uploaderId || 'unknown',
      ...metadata,
    });

    return result;
  } catch (error) {
    console.error(`AI extraction trigger failed for ${uploadId}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Process a link import (Google Drive) - fetches the file, stores it, runs OCR + AI synchronously.
 */
export async function processLinkImport(
  fileUrl: string,
  uploaderId: string,
  _metadata: {
    title?: string;
    institution?: string;
    course?: string;
    courseCode?: string;
    year?: string;
    semester?: 'First' | 'Second';
    type?: 'Objective' | 'Theory' | 'Mixed';
  } = {}
) {
  const supabase = createServerSupabase();
  const { v4: uuidv4 } = await import('uuid');

  // Create upload record for the link import
  const uploadRecord = {
    id: uuidv4(),
    uploader_id: uploaderId,
    file_name: `link-import-${Date.now()}.pdf`,
    file_url: fileUrl,
    file_type: 'link-import',
    file_size: 0,
    upload_status: 'processing' as const,
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: new Date().toISOString(),
    processed_at: null
  };

  const { data: uploadRecordData, error: insertError } = await supabase
    .from('question_uploads')
    .insert([uploadRecord])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to save upload record: ${insertError.message}`);
  }

  // Process the link import asynchronously
  processLinkImportAsync(uploadRecordData.id, fileUrl, uploaderId, _metadata).catch(err => {
    console.error('Link import processing failed:', err);
  });

  return {
    upload: uploadRecordData,
    ocrText: null,
    ocrConfidence: null,
    fileUrl,
  };
}

/**
 * Process a link import asynchronously.
 */
async function processLinkImportAsync(uploadId: string, fileUrl: string, uploaderId: string, formMetadata?: {
  title?: string;
  institution?: string;
  course?: string;
  courseCode?: string;
  year?: string;
  semester?: 'First' | 'Second';
}) {
  const supabase = createServerSupabase();

  try {
    // Import the document processor
    const { processQuestionDocument } = await import('@/ai/flows/process-question-document');

    // Run the AI document flow to extract text and metadata
    const result = await processQuestionDocument({ fileUrl });

    // Update upload record with extracted content
    const { error: updateError } = await supabase
      .from('question_uploads')
      .update({
        upload_status: 'processed' as const,
        ocr_text: result.fullContent,
        ocr_confidence: JSON.stringify({ overall: 0.9 }),
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    if (updateError) {
      console.error('Failed to update link import record:', updateError);
    }

    // Create question record from extracted metadata
    const { processUploadedQuestionFlow } = await import('@/ai/flows/process-uploaded-question');
    await processUploadedQuestionFlow({
      uploadId,
      ocrText: result.fullContent,
      filename: `link-import-${Date.now()}.pdf`,
      uploaderId,
      institution: formMetadata?.institution,
      course: formMetadata?.course,
      courseCode: formMetadata?.courseCode,
      year: formMetadata?.year,
      semester: formMetadata?.semester,
    });

    console.log(`Link import ${uploadId} processed successfully`);
  } catch (error) {
    console.error('Link import processing failed:', error);
    await supabase
      .from('question_uploads')
      .update({
        upload_status: 'failed' as const,
        ocr_text: `Link import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);
  }
}

/**
 * Synchronously process OCR and update the upload record, then trigger AI extraction.
 * This runs within the serverless function lifecycle.
 */
async function processOcrSync(uploadId: string, file: File, _storageFileName: string, formMetadata?: {
  title?: string;
  institution?: string;
  course?: string;
  courseCode?: string;
  year?: string;
  semester?: 'First' | 'Second';
}) {
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
        institution: formMetadata?.institution,
        course: formMetadata?.course,
        courseCode: formMetadata?.courseCode,
        year: formMetadata?.year,
        semester: formMetadata?.semester,
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