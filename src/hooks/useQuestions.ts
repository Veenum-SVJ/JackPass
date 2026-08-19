import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Question } from '@/lib/types';

export interface QuestionFilters {
  institution?: string;
  course?: string;
  year?: string;
  semester?: string;
  type?: string;
}

/**
 * Fetch the list of approved questions from the API.
 */
export function useQuestions(filters?: QuestionFilters) {
  return useQuery({
    queryKey: ['questions', filters ?? {}],
    queryFn: async (): Promise<Question[]> => {
      const params = new URLSearchParams();
      if (filters?.institution) params.set('institution', filters.institution);
      if (filters?.course) params.set('course', filters.course);
      if (filters?.year) params.set('year', filters.year);
      if (filters?.semester) params.set('semester', filters.semester);
      if (filters?.type) params.set('type', filters.type);

      const queryString = params.toString();
      return apiFetch<Question[]>(`/api/questions${queryString ? `?${queryString}` : ''}`, {}, { auth: false });
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch a single question by id.
 */
export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: async (): Promise<Question> => {
      if (!id) throw new Error('Question id is required');
      return apiFetch<Question>(`/api/questions/${id}`, {}, { auth: false });
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch questions uploaded by a specific user.
 */
export function useUserUploads(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-uploads', userId],
    queryFn: async (): Promise<Question[]> => {
      if (!userId) return [];
      return apiFetch<Question[]>(`/api/users/${userId}/uploads`);
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
