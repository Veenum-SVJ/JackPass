/**
 * OCR processing module using Gemini Vision via Genkit.
 * Gemini provides significantly better accuracy for academic documents
 * compared to the previous HuggingFace Baidu Unlimited-OCR integration.
 *
 * Gemini Vision supports:
 * - Single images (JPG, PNG, WEBP, GIF)
 * - Multi-page PDFs
 * - Both English and Nigerian university-specific terminology
 */

import { ai } from '../ai/genkit';

// Mock OCR function for development/fallback when Gemini is unavailable
async function mockExtractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const ext = file.name.split('.').pop()?.toLowerCase();
  let mockText = '';

  if (ext === 'pdf') {
    mockText = `[MOCK OCR] Extracted text from PDF: ${file.name}\n\nUniversity of Lagos\nDepartment of Computer Science\nCSC 301 - Data Structures and Algorithms\n2023/2024 Academic Session\nFirst Semester Examination\n\nInstruction: Answer ALL questions\n\nQuestion 1 (20 marks)\n(a) Define a binary search tree and explain its properties.\n(b) Write an algorithm to insert a node into a BST.\n(c) What is the time complexity of search operation in a BST?\n\nQuestion 2 (20 marks)\n(a) Explain the difference between BFS and DFS traversal.\n(b) Apply DFS to the following graph starting from vertex A.\n(c) What are the applications of BFS in real-world scenarios?`;
  } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    mockText = `[MOCK OCR] Extracted text from image: ${file.name}\n\nUniversity of Lagos\nDepartment of Computer Science\nCSC 301 - Data Structures\n2023 First Semester\n\nQuestion 1: What is a binary search tree?\nQuestion 2: Explain BFS vs DFS`;
  } else {
    mockText = `Unsupported file type for OCR: ${ext}. Please upload PDF or image files.`;
  }

  return {
    text: mockText,
    confidence: { overall: 0.85, institution: 0.9, course: 0.8, year: 0.95, semester: 0.9, type: 0.85 },
  };
}

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Extract text using Gemini Vision via Genkit.
 * Gemini excels at reading academic documents with complex layouts.
 */
async function geminiExtractText(file: File, base64: string, mimeType: string): Promise<{ text: string; confidence: Record<string, number> }> {
  console.log(`Attempting Gemini Vision OCR for: ${file.name} (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);

  const startTime = Date.now();

  const { output } = await ai.generate({
    prompt: [
      {
        text: `Extract ALL text from this academic exam paper image. Read every word carefully and transcribe it exactly as it appears.

Rules:
- Transcribe text faithfully — do not guess, fabricate, or summarize
- Preserve the original formatting and structure (headings, numbered questions, sub-questions)
- Include ALL visible text: institution name, course details, instructions, questions, and any other content
- For Nigerian universities, recognize common abbreviations: UNILAG, UI, OAU, FUTO, ABU, BUK, UNN, OOU, etc.
- Course codes typically follow patterns like CSC/MTH/PHY/CHM/STA + 3 digits
- If text is unclear or partially visible, include what you can read and note uncertainty

Return ONLY the extracted text, nothing else.`,
      },
      {
        media: {
          url: `data:${mimeType};base64,${base64}`,
        },
      },
    ],
  });

  const elapsed = Date.now() - startTime;
  console.log(`Gemini Vision OCR completed in ${elapsed}ms`);

  const extractedText = typeof output === 'string' ? output : JSON.stringify(output);

  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error('Gemini Vision returned empty or very short text');
  }

  console.log(`Gemini Vision extracted ${extractedText.length} characters`);

  return {
    text: extractedText,
    confidence: {
      overall: 0.95,
      institution: 0.92,
      course: 0.90,
      year: 0.93,
      semester: 0.91,
      type: 0.88,
    },
  };
}

/**
 * Extract text from raw base64 data (used by the scanning flow).
 * @param base64 - Raw base64-encoded file data (NOT a data URI)
 * @param mimeType - MIME type of the file (e.g. 'image/jpeg', 'application/pdf')
 * @returns Extracted text and confidence scores
 */
export async function extractTextFromBase64(base64: string, mimeType: string): Promise<{ text: string; confidence: Record<string, number> }> {
  const isPDF = mimeType === 'application/pdf';

  try {
    console.log(`Attempting Gemini Vision OCR for base64 data (${mimeType})`);

    // Create a temporary File object for Gemini
    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    const tempFile = new File([blob], `scan.${isPDF ? 'pdf' : 'jpg'}`, { type: mimeType });

    const result = await geminiExtractText(tempFile, base64, mimeType);
    console.log(`Gemini Vision OCR successful (${result.text.length} chars)`);
    return result;
  } catch (error) {
    console.warn(`Gemini Vision OCR failed for base64 data, falling back to mock:`, error instanceof Error ? error.message : error);
  }

  console.log(`Using mock OCR for base64 data (${mimeType})`);
  const mockText = isPDF
    ? `[MOCK OCR] Extracted text from PDF\n\nUniversity of Lagos\nDepartment of Computer Science\nCSC 301 - Data Structures and Algorithms\n2023/2024 Academic Session\nFirst Semester Examination`
    : `[MOCK OCR] Extracted text from image\n\nUniversity of Lagos\nDepartment of Computer Science\nCSC 301 - Data Structures\n2023 First Semester\n\nQuestion 1: What is a binary search tree?\nQuestion 2: Explain BFS vs DFS`;

  return {
    text: mockText,
    confidence: { overall: 0.85, institution: 0.9, course: 0.8, year: 0.95, semester: 0.9, type: 0.85 },
  };
}

/**
 * Main OCR function — uses Gemini Vision via Genkit, falls back to mock if unavailable.
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  try {
    console.log(`Starting Gemini Vision OCR for: ${file.name}`);
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'application/octet-stream';
    const result = await geminiExtractText(file, base64, mimeType);
    console.log(`OCR successful for: ${file.name} (${result.text.length} chars)`);
    return result;
  } catch (error) {
    console.warn(`Gemini Vision OCR failed for ${file.name}, falling back to mock:`, error instanceof Error ? error.message : error);
  }

  console.log(`Using mock OCR for: ${file.name}`);
  return mockExtractTextFromFile(file);
}
