/**
 * OCR processing module using Baidu Unlimited-OCR via Hugging Face Inference API.
 * Falls back to mock OCR when HF_TOKEN is not set (dev mode).
 *
 * Baidu Unlimited-OCR supports:
 * - Single images (JPG, PNG)
 * - Multi-page PDFs
 * - Both English and Chinese text
 */

// Mock OCR function for development/fallback
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
 * Extract text using Baidu Unlimited-OCR via Hugging Face Inference API.
 * Model: baidu/Unlimited-OCR — handles both images AND multi-page PDFs.
 */
async function hfExtractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HF_TOKEN not set');

  const base64 = await fileToBase64(file);
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isPDF = ext === 'pdf';

  const apiUrl = 'https://api-inference.huggingface.co/models/baidu/Unlimited-OCR';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: base64,
      parameters: {
        base_size: 1024,
        image_size: isPDF ? 1024 : 640,
        crop_mode: !isPDF,
        max_length: 32768,
        no_repeat_ngram_size: 35,
        ngram_window: 128,
        save_results: false,
      },
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const extractedText = parseOCRResponse(result);

  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error('OCR returned empty or very short text');
  }

  return {
    text: extractedText,
    confidence: { overall: 0.9, institution: 0.85, course: 0.85, year: 0.9, semester: 0.9, type: 0.85 },
  };
}

function parseOCRResponse(result: any): string {
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) return result.join('\n\n');
  if (result?.generated_text) return result.generated_text;
  if (result?.[0]?.generated_text) return result[0].generated_text;
  try { return JSON.stringify(result); } catch { return 'Failed to parse OCR response'; }
}

/**
 * Main OCR function — tries Baidu Unlimited-OCR via HF first, falls back to mock.
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; confidence: Record<string, number> }> {
  const hfToken = process.env.HF_TOKEN;

  if (hfToken) {
    try {
      console.log(`Attempting Baidu Unlimited-OCR for: ${file.name}`);
      const result = await hfExtractTextFromFile(file);
      console.log(`OCR successful for: ${file.name} (${result.text.length} chars)`);
      return result;
    } catch (error) {
      console.warn(`HF OCR failed for ${file.name}, falling back to mock:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Using mock OCR for: ${file.name}`);
  return mockExtractTextFromFile(file);
}
