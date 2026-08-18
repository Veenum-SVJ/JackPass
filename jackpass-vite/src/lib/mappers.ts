import type { Question } from './types';

/**
 * A raw row as returned by Supabase (snake_case columns).
 */
export interface QuestionRow {
  id: string;
  title: string;
  institution: string;
  course: string;
  faculty?: string | null;
  department?: string | null;
  year: number;
  semester: 'First' | 'Second';
  type: 'Objective' | 'Theory' | 'Mixed';
  status: 'pending' | 'approved' | 'rejected';
  content_preview: string | null;
  full_content: string | null;
  answer?: string | null;
  explanation?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  uploader_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  ai_extracted_data?: unknown;
}

/**
 * Map a Supabase row to the app's Question type.
 */
export function mapQuestionRow(row: QuestionRow): Question {
  return {
    id: row.id,
    title: row.title,
    institution: row.institution,
    course: row.course,
    year: row.year,
    semester: row.semester,
    type: row.type,
    status: row.status,
    contentPreview: row.content_preview ?? '',
    fullContent: row.full_content ?? '',
    answer: row.answer ?? undefined,
    explanation: row.explanation ?? undefined,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    fileType: row.file_type ?? undefined,
    uploaderId: row.uploader_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}
