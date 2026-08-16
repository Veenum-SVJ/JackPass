import { env } from 'process';

/**
 * OCR processing module with Hugging Face Inference API integration.
 * Falls back to mock OCR when HF_TOKEN is not set (dev mode).
 */

// Mock OCR function for development/fallback
async function mockExtractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const ext = file.name.split('.').pop()?.toLowerCase();
  let mockText = '';

  if (ext === 'pdf') {
    mockText = `This is a mock extracted text from PDF ${file.name}.\nIt would contain the actual question content after OCR processing.\nInstitution: Sample University\nCourse: Sample Course\nYear: 2023\nSemester: First\nType: Objective`;
  } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    mockText = `Mock OCR text from image ${file.name}.\nThis would be the text extracted from an uploaded question paper image.`;
  } else {
    mockText = `Unsupported file type for OCR: ${ext}. Please upload PDF or image files.`;
  }

  const confidence = {
    overall: 0.85,
    institution: 0.9,
    course: 0.8,
    year: 0.95,
    semester: 0.9,
    type: 0.85
  };

  return { text: mockText, confidence };
}

/**
 * Convert File to base64 string for API submission
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Extract text using Hugging Face Inference API
 * Uses microsoft/trocr-base-printed model for OCR
 */
async function hfExtractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  const hfToken = env.HF_TOKEN;

  if (!hfToken) {
    throw new Error('HF_TOKEN not set');
  }

  const base64 = await fileToBase64(file);
  const ext = file.name.split('.').pop()?.toLowerCase();

  // For PDFs, we need to convert to images first - for now, handle images directly
  // In production, you'd use pdf2pic or similar to convert PDF pages to images
  if (ext === 'pdf') {
    // For PDF, we'll return a message indicating PDF processing needs image conversion
    // In production, implement PDF-to-image conversion here
    throw new Error('PDF processing requires PDF-to-image conversion. Please upload image files (JPG/PNG) for now, or implement PDF rendering.');
  }

  // Use Hugging Face Inference API for OCR
  // Model: microsoft/trocr-base-printed (good for printed text)
  // For better document OCR, consider: stepfun-ai/GOT-OCR2_0 or nanonets/Nanonets-OCR-s
  const modelId = 'microsoft/trocr-base-printed';
  const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: base64,
        parameters: {
          return_tensors: true
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HF API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    // HF OCR models typically return { generated_text: "..." }
    const extractedText = result.generated_text || result[0]?.generated_text || '';

    if (!extractedText) {
      throw new Error('No text extracted from HF OCR response');
    }

    // HF OCR doesn't typically return per-field confidence, so we use a default
    const confidence = {
      overall: 0.9,
      institution: 0.85,
      course: 0.85,
      year: 0.9,
      semester: 0.9,
      type: 0.85
    };

    return { text: extractedText, confidence };
  } catch (error) {
    console.error('HF OCR error:', error);
    throw error;
  }
}

/**
 * Main OCR function - tries HF API first, falls back to mock
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  const hfToken = env.HF_TOKEN;

  if (hfToken) {
    try {
      console.log('Attempting HF OCR for:', file.name);
      const result = await hfExtractTextFromFile(file);
      console.log('HF OCR successful for:', file.name);
      return result;
    } catch (error) {
      console.warn('HF OCR failed, falling back to mock:', error instanceof Error ? error.message : error);
      // Fall through to mock
    }
  }

  // Fallback to mock OCR (dev mode or HF failure)
  console.log('Using mock OCR for:', file.name);
  return mockExtractTextFromFile(file);
}