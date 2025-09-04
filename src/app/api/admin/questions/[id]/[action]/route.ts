import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const questions = loadQuestions();
    const questionIndex = questions.findIndex(q => q.id === id);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found.' },
        { status: 404 }
      );
    }

    // Update the question status
    questions[questionIndex].status = action === 'approve' ? 'approved' : 'rejected';
    saveQuestions(questions);

    console.log(`Question ${id} ${action}d successfully`);

    return NextResponse.json({
      success: true,
      message: `Question ${action}d successfully.`,
      question: questions[questionIndex]
    });

  } catch (error) {
    console.error(`Error ${action}ing question:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
