import { createBrowserSupabase } from '@/lib/supabase';
import type { Question } from './types';
import { institutions as staticInstitutions } from './institutions';

export const institutions = staticInstitutions;

const getSupabase = () => createBrowserSupabase();

export const getAllQuestions = async (): Promise<Question[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  return data || [];
};

export const getApprovedQuestions = async (): Promise<Question[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved questions:', error);
    return [];
  }

  return data || [];
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching question:', error);
    return null;
  }

  return data || null;
};

export const getRelatedQuestions = async (currentQuestion: Question): Promise<Question[]> => {
  if (!currentQuestion) return [];

  const supabase = getSupabase();

  // Fetch by same course
  const { data: courseData } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved')
    .eq('course', currentQuestion.course)
    .limit(3);

  // Fetch by same institution
  const { data: institutionData } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'approved')
    .eq('institution', currentQuestion.institution)
    .limit(3);

  const relatedMap = new Map<string, Question>();

  courseData?.forEach(doc => {
    if (doc.id !== currentQuestion.id) {
      relatedMap.set(doc.id, doc as Question);
    }
  });

  institutionData?.forEach(doc => {
    if (doc.id !== currentQuestion.id) {
      relatedMap.set(doc.id, doc as Question);
    }
  });

  return Array.from(relatedMap.values()).slice(0, 3);
};