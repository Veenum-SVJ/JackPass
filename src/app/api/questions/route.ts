import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import type { Question } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map Supabase question to our Question type
    const questions: Question[] = data.map((q: any) => ({
      id: q.id,
      title: q.title,
      institution: q.institution,
      course: q.course,
      year: q.year,
      semester: q.semester as 'First' | 'Second',
      type: q.type as 'Objective' | 'Theory' | 'Mixed',
      status: q.status as 'pending' | 'approved' | 'rejected',
      contentPreview: q.content_preview,
      fullContent: q.full_content,
      answer: q.answer,
      explanation: q.explanation,
      fileUrl: q.file_url,
      uploaderId: q.uploader_id,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }));

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}