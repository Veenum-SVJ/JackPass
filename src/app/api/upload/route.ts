import { NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Question } from '@/lib/types';

// Simple file-based storage for questions
const QUESTIONS_FILE = join(process.cwd(), 'data', 'questions.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
};

// Load questions from file
const loadQuestions = (): Question[] => {
  try {
    ensureDataDir();
    if (existsSync(QUESTIONS_FILE)) {
      const data = readFileSync(QUESTIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading questions:', error);
  }
  return [];
};

// Save questions to file
const saveQuestions = (questions: Question[]) => {
  try {
    ensureDataDir();
    writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2));
  } catch (error) {
    console.error('Error saving questions:', error);
  }
};

export async function POST(request: Request) {
  try {
    console.log('Upload API called - starting to process request');
    
    // Try to parse FormData without strict content-type checking
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('FormData parsing failed:', error);
      return NextResponse.json(
        { error: 'Failed to parse form data. Please try again.' },
        { status: 400 }
      );
    }
    
    console.log('FormData received, extracting fields...');
    
    // Extract form fields with better error handling
    const institution = formData.get('institution');
    const course = formData.get('course');
    const year = formData.get('year');
    const semester = formData.get('semester');
    const uploaderId = formData.get('uploaderId');
    const questionFiles = formData.getAll('questionFiles');

    console.log('Raw form data:', {
      institution: typeof institution,
      course: typeof course,
      year: typeof year,
      semester: typeof semester,
      uploaderId: typeof uploaderId,
      fileCount: questionFiles.length
    });

    // Convert and validate
    const institutionStr = institution?.toString() || '';
    const courseStr = course?.toString() || '';
    const yearNum = year ? Number(year) : 0;
    const semesterStr = semester?.toString() as 'First' | 'Second' || 'First';
    const uploaderIdStr = uploaderId?.toString() || '';

    console.log('Processed form data:', {
      institution: institutionStr,
      course: courseStr,
      year: yearNum,
      semester: semesterStr,
      uploaderId: uploaderIdStr,
      fileCount: questionFiles.length
    });

    // Validate required fields
    if (!institutionStr || !courseStr || !yearNum || !semesterStr || !uploaderIdStr) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields', details: { institution: !!institutionStr, course: !!courseStr, year: !!yearNum, semester: !!semesterStr, uploaderId: !!uploaderIdStr } },
        { status: 400 }
      );
    }

    console.log('Validation passed, creating question...');

    // Create new question
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${courseStr.substring(0, 30)}... Past Question (${yearNum})`,
      institution: institutionStr,
      course: courseStr,
      year: yearNum,
      semester: semesterStr,
      type: 'Mixed',
      status: 'pending',
      contentPreview: `A newly uploaded past question for ${courseStr} from ${yearNum}. Contains ${questionFiles.length} file(s).`,
      fullContent: 'The full content would be extracted by a more advanced OCR/parser process. This is a placeholder.',
      fileUrl: 'https://example.com/placeholder.pdf', // Placeholder
      createdAt: new Date(),
      uploaderId: uploaderIdStr
    };

    console.log('Question object created:', newQuestion);

    // Load existing questions and add new one
    const questions = loadQuestions();
    console.log('Loaded existing questions:', questions.length);
    
    questions.push(newQuestion);
    saveQuestions(questions);
    console.log('Question saved successfully');

    console.log('Question uploaded successfully:', newQuestion.id);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully added 1 new question for review.`,
      question: newQuestion
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
