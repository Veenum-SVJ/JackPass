import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type QuestionStatus = 'pending' | 'approved' | 'rejected';

export interface AdminQuestion {
  id: string;
  title: string;
  institution: string;
  course: string;
  year: number;
  semester: string;
  type: string;
  status: QuestionStatus;
  content_preview: string;
  full_content: string;
  uploader_id: string;
  created_at: string;
  ai_extracted_data?: {
    confidence?: {
      overall: number;
      institution: number;
      course: number;
      year: number;
      semester: number;
      type: number;
    };
  };
  answer?: string;
  explanation?: string;
}

export interface AdminQuestionsParams {
  search?: string;
  status?: 'all' | QuestionStatus;
  institution?: string;
}

/**
 * Fetch questions for moderation (admin only).
 */
export function useAdminQuestions(params: AdminQuestionsParams) {
  return useQuery({
    queryKey: ['admin-questions', params],
    queryFn: async (): Promise<AdminQuestion[]> => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.status && params.status !== 'all') searchParams.set('status', params.status);
      if (params.institution) searchParams.set('institution', params.institution);

      const queryString = searchParams.toString();
      return apiFetch<AdminQuestion[]>(`/api/admin/questions${queryString ? `?${queryString}` : ''}`);
    },
  });
}

/**
 * Fetch the unique list of institutions from the questions table (admin only).
 */
export function useAdminInstitutions() {
  return useQuery({
    queryKey: ['admin-institutions'],
    queryFn: async (): Promise<string[]> => {
      return apiFetch<string[]>('/api/admin/questions?institutions=true');
    },
  });
}

/**
 * Approve or reject a question (admin only).
 */
export function useModerateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      return apiFetch<{ success: boolean }>(`/api/admin/questions/${id}/${action}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
