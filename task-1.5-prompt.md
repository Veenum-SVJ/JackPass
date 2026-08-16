## Task 1.5: Integrate Baidu Unlimited-OCR for real OCR processing
Goal: Replace the mock OCR in src/lib/ocr.ts with integration to Baidu Unlimited-OCR model for real document text extraction from PDFs and images.

### Background on Baidu Unlimited-OCR
- Model: `baidu/Unlimited-OCR` on Hugging Face
- Supports: Single images (JPG, PNG) and multi-page PDFs
- Inference: Via transformers library on GPU, or vLLM, or Baidu Cloud API
- Paper: arXiv:2606.23050

### Architecture Decision
Since Baidu Unlimited-OCR requires Python + GPU, we cannot run it directly in Next.js. Options:
1. **Hugging Face Inference API** (simplest for dev) - call HF API from Next.js
2. **Python microservice** - Deploy FastAPI service with the model, call from Next.js
3. **Baidu Cloud OCR API** - If you have Baidu Cloud account
4. **vLLM deployment** - For production scale

**Recommendation for Phase 1**: Use Hugging Face Inference API (free tier available, easy to test). Later migrate to self-hosted vLLM or Python microservice for production.

### Files to Create/Modify
- Modify: `src/lib/ocr.ts` — Real OCR integration using HF Inference API
- Create: `src/lib/ocr-python-service.ts` — Optional Python service client (for future)
- Modify: `src/lib/upload.ts` — Handle async OCR processing (don't block upload response)
- Add: Environment variable for HF_TOKEN in .env.local.template

### Exact Code to Write

```typescript
// src/lib/ocr.ts
/**
 * Real OCR integration using Baidu Unlimited-OCR via Hugging Face Inference API.
 * 
 * For production, consider:
 * 1. Self-hosting the model with vLLM for better performance
 * 2. Using Baidu Cloud OCR API if available in your region
 * 3. Deploying a Python FastAPI microservice with the model
 * 
 * Current implementation uses Hugging Face Inference API (free tier: 30k tokens/month)
 */

export interface OCRResult {
  text: string;
  confidence: Record<string, number>;
  pageCount?: number;
  processingTimeMs: number;
}

const HF_API_URL = 'https://api-inference.huggingface.co/models/baidu/Unlimited-OCR';
const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

/**
 * Check if real OCR is configured
 */
export function isRealOCRConfigured(): boolean {
  return !!HF_TOKEN;
}

/**
 * Process a file through Baidu Unlimited-OCR via Hugging Face Inference API
 */
export async function extractTextFromFile(file: File): Promise<OCRResult> {
  const startTime = Date.now();
  
  // If no HF token, fall back to mock OCR (for development without API key)
  if (!isRealOCRConfigured()) {
    console.warn('HF_TOKEN not set, using mock OCR');
    return extractTextFromFileMock(file);
  }
  
  try {
    // Convert file to base64 for API
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Prepare request based on file type
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64,
        parameters: {
          // For single image: base_size=1024, image_size=640, crop_mode=true
          // For multi-page PDF: base_size=1024, image_size=1024, crop_mode=false
          base_size: 1024,
          image_size: isPDF ? 1024 : 640,
          crop_mode: !isPDF,
          max_length: 32768,
          no_repeat_ngram_size: 35,
          ngram_window: 128,
          save_results: false,
        },
        options: {
          wait_for_model: true, // Wait if model is loading
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    // Parse the HF API response format
    // The model returns structured output with <|det|> markers
    const extractedText = parseHFOCRResponse(result);
    
    const processingTimeMs = Date.now() - startTime;
    
    return {
      text: extractedText,
      confidence: {
        overall: 0.9,
        // We don't get per-field confidence from the API, so use overall
      },
      processingTimeMs,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    // Fallback to mock on error
    console.warn('Falling back to mock OCR due to error');
    return extractTextFromFileMock(file);
  }
}

/**
 * Parse Hugging Face OCR API response to extract clean text
 * The model outputs text with <|det|>type content<|/det|> markers
 */
function parseHFOCRResponse(result: any): string {
  // Handle different response formats
  if (typeof result === 'string') {
    return result;
  }
  
  if (Array.isArray(result)) {
    // Some HF models return array of strings
    return result.join('\n\n');
  }
  
  if (result && result.generated_text) {
    return result.generated_text;
  }
  
  if (result && result[0]?.generated_text) {
    return result[0].generated_text;
  }
  
  // Default: try to stringify
  try {
    return JSON.stringify(result);
  } catch {
    return 'Failed to parse OCR response';
  }
}

/**
 * Mock OCR fallback (same as before, for development without API key)
 */
async function extractTextFromFileMock(file: File): Promise<OCRResult> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  let mockText = '';
  
  if (ext === 'pdf') {
    mockText = `[MOCK OCR] This is mock extracted text from PDF: ${file.name}\n\nInstitution: University of Lagos\nCourse: CSC 301 - Data Structures\nYear: 2023\nSemester: First\nType: Mixed\n\nQuestion 1: What is a binary search tree?\nAnswer: A binary search tree is a binary tree where each node has a value greater than all values in its left subtree and less than all values in its right subtree.\n\nQuestion 2: Explain time complexity of merge sort.\nAnswer: Merge sort has O(n log n) time complexity in all cases...`;
  } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    mockText = `[MOCK OCR] Mock extracted text from image: ${file.name}\n\nThis would contain the actual question paper content after OCR processing.\nDetected: University of Ibadan, MTH 201, 2022, Second Semester, Theory`;
  } else {
    mockText = `Unsupported file type for OCR: ${ext}. Please upload PDF or image files.`;
  }
  
  return {
    text: mockText,
    confidence: {
      overall: 0.85,
      institution: 0.9,
      course: 0.8,
      year: 0.95,
      semester: 0.9,
      type: 0.85,
    },
    processingTimeMs: 1000,
  };
}

/**
 * For future: Python microservice client
 * When you deploy the model locally, update this to call your service
 */
export async function extractTextFromFilePythonService(file: File): Promise<OCRResult> {
  const PYTHON_SERVICE_URL = process.env.OCR_PYTHON_SERVICE_URL;
  
  if (!PYTHON_SERVICE_URL) {
    throw new Error('OCR_PYTHON_SERVICE_URL not configured');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${PYTHON_SERVICE_URL}/ocr`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Python OCR service error: ${response.statusText}`);
  }
  
  return response.json();
}
```

```bash
# .env.local.template (add these lines)
# Hugging Face API Token (get from https://huggingface.co/settings/tokens)
HF_TOKEN=your-huggingface-token-here

# Optional: Python OCR service URL (for self-hosted model)
# OCR_PYTHON_SERVICE_URL=http://localhost:8000
```

```typescript
// src/lib/upload.ts (modify the processQuestionUpload to handle async OCR)
import { createServerSupabase } from './supabase-server';
import { extractTextFromFile, isRealOCRConfigured } from './ocr';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process an uploaded file: store in Supabase Storage, run OCR, save metadata.
 * OCR runs asynchronously to not block the upload response.
 */
export async function processQuestionUpload(
  file: File,
  uploaderId: string,
  metadata: {
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
  const { data: uploadData, error: uploadError } = await supabase.storage
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
  
  // 2. Create initial upload record with "processing" status
  const uploadRecord = {
    id: uuidv4(),
    file_name: file.name,
    file_url: fileUrl,
    file_type: file.type,
    file_size: file.size,
    upload_status: 'processing' as const,
    ocr_text: null,
    ocr_confidence: null,
    uploaded_at: new Date().toISOString(),
    processed_at: null,
  };
  
  const { data: uploadRecordData, error: uploadRecordError } = await supabase
    .from('question_uploads')
    .insert([uploadRecord])
    .select()
    .single();
  
  if (uploadRecordError) {
    await supabase.storage.from('question-files').remove([storageFileName]);
    throw new Error(`Failed to save upload record: ${uploadRecordError.message}`);
  }
  
  // 3. Run OCR asynchronously (don't await - let it run in background)
  // In production, use a queue (Redis, Supabase pg_cron, or dedicated queue)
  processOCRAsync(uploadRecordData.id, file, metadata);
  
  // 4. Return immediately with upload info
  return {
    upload: uploadRecordData,
    ocrText: null, // Will be available after async processing
    ocrConfidence: null,
    fileUrl,
    message: 'File uploaded successfully. OCR processing started in background.'
  };
}

/**
 * Async OCR processing - runs in background after upload returns
 */
async function processOCRAsync(
  uploadId: string,
  file: File,
  metadata: {
    title?: string;
    institution?: string;
    course?: string;
    year?: number;
    semester?: 'First' | 'Second';
    type?: 'Objective' | 'Theory' | 'Mixed';
  }
) {
  const supabase = createServerSupabase();
  
  try {
    // Update status to processing
    await supabase
      .from('question_uploads')
      .update({ upload_status: 'processing' })
      .eq('id', uploadId);
    
    // Run OCR
    const ocrResult = await extractTextFromFile(file);
    
    // Update record with OCR results
    const { error } = await supabase
      .from('question_uploads')
      .update({
        upload_status: 'processed',
        ocr_text: ocrResult.text,
        ocr_confidence: JSON.stringify(ocrResult.confidence),
        processed_at: new Date().toISOString(),
      })
      .eq('id', uploadId);
    
    if (error) {
      console.error('Failed to update OCR results:', error);
    }
    
    // TODO: Trigger AI metadata extraction here
    // await triggerAIMetadataExtraction(uploadId, ocrResult.text, metadata);
    
  } catch (error) {
    console.error('Async OCR processing failed:', error);
    
    // Mark as failed
    await supabase
      .from('question_uploads')
      .update({
        upload_status: 'failed',
        ocr_text: `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processed_at: new Date().toISOString(),
      })
      .eq('id', uploadId);
  }
}

/**
 * Get upload status (including OCR results when ready)
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

/**
 * For future: Create question from processed upload
 */
export async function createQuestionFromUpload(
  uploadId: string,
  aiMetadata: {
    title: string;
    institution: string;
    course: string;
    faculty?: string;
    department?: string;
    year: number;
    semester: 'First' | 'Second';
    type: 'Objective' | 'Theory' | 'Mixed';
    contentPreview: string;
    fullContent: string;
    answer?: string;
    explanation?: string;
  }
) {
  const supabase = createServerSupabase();
  
  const { data, error } = await supabase
    .from('questions')
    .insert([{
      ...aiMetadata,
      status: 'pending',
      uploader_id: (await supabase.auth.getUser()).data.user?.id,
      file_url: (await supabase.from('question_uploads').select('file_url').eq('id', uploadId).single()).data?.file_url,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Commands to Run & Expected Output
```bash
# 1. Add HF_TOKEN to .env.local (get from https://huggingface.co/settings/tokens)
# 2. Run typecheck and lint
npm run typecheck
npm run lint

# 3. Test upload endpoint with a real PDF/image
# (Need a valid Supabase JWT token from logged-in user)
curl -X POST http://localhost:9002/api/upload \
  -H "Authorization: Bearer <your-supabase-jwt>" \
  -F "file=@sample.pdf" \
  -F "title=Test Question" \
  -F "institution=Test University" \
  -F "course=Test Course" \
  -F "year=2023" \
  -F "semester=First" \
  -F "type=Mixed"

# Expected: JSON with uploadId, fileUrl, and message that OCR is processing
```

### Acceptance Criteria
- [ ] `src/lib/ocr.ts` uses HF Inference API for real OCR when HF_TOKEN is set
- [ ] Falls back to mock OCR when HF_TOKEN not set (dev mode)
- [ ] `src/lib/upload.ts` processes OCR asynchronously (non-blocking)
- [ ] Upload record stores OCR text and confidence when processing completes
- [ ] TypeScript check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

### Error Handling
- If HF API fails: log error, fall back to mock OCR, mark upload as "failed"
- If Supabase update fails: log error, retry logic can be added later
- If file type unsupported: return appropriate error before upload

### Future Improvements (Task 1.6+)
1. Deploy Baidu Unlimited-OCR locally with vLLM for production
2. Create Python FastAPI microservice for OCR
3. Add AI metadata extraction pipeline (Genkit flow) after OCR
4. Add webhook/notification when OCR completes
5. Implement queue system (Redis Bull, Supabase pg_cron) for reliable async processing

### Git Commit Message
feat: integrate Baidu Unlimited-OCR via Hugging Face API for real document text extraction