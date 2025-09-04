import { NextResponse } from 'next/server';
import { readFileSync, existsSync, mkdirSync } from 'fs';
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

export async function GET() {
  try {
    const questions = loadQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
