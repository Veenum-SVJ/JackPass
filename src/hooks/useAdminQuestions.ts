import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { MarksQuestion } from '@/lib/types';

export type QuestionStatus = 'pending' | 'approved' | 'rejected';

export interface AdminQuestion {
  id: string;
  title: string;
  institution: string;
  course: string;
  course_code?: string;
  year: number | string;
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
  marks_scheme?: MarksQuestion[];
  answer_generated?: string;
}

export interface AdminQuestionsParams {
  search?: string;
  status?: 'all' | QuestionStatus;
  institution?: string;
}

/**
 * Fetch exam papers for moderation (admin only).
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
 * Fetch the unique list of institutions from the exam papers table (admin only).
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
 * Approve or reject an exam paper (admin only).
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

/**
 * Bulk approve or reject multiple exam papers (admin only).
 */
export function useBulkModerateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'approve' | 'reject' }) => {
      return apiFetch<{ success: boolean }>(`/api/admin/questions/bulk/${action}`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

/**
 * Update exam paper content (admin only).
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      return apiFetch<{ success: boolean; question: AdminQuestion }>(`/api/admin/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

/**
 * Re-process an exam paper's OCR using Gemini Vision (admin only).
 */
export function useReprocessQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, signal }: { id: string; signal?: AbortSignal }) => {
      return apiFetch<{ success: boolean; question: AdminQuestion; ocrConfidence: Record<string, number> }>(`/api/admin/questions/${id}/reprocess`, {
        method: 'POST',
        signal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

/**
 * Generate AI model answer for an exam paper (admin only).
 */
export function useGenerateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, signal }: { id: string; signal?: AbortSignal }) => {
      return apiFetch<{ success: boolean; question: AdminQuestion }>(`/api/admin/questions/${id}/generate-answer`, {
        method: 'POST',
        signal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export type ReprocessStep = 'idle' | 'starting' | 'fetching_file' | 'ai_processing' | 'processing_results' | 'complete' | 'unknown';

/**
 * Poll reprocess status for a question (used by progress indicator).
 */
export function useReprocessStatus(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['reprocess-status', id],
    queryFn: async (): Promise<{ step: ReprocessStep; status: string }> => {
      return apiFetch(`/api/admin/questions/${id}/reprocess-status`);
    },
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      // Stop polling when complete or on error
      const step = query.state.data?.step;
      if (step === 'complete' || step === 'idle' || step === 'unknown') return false;
      return 1000; // Poll every 1 second
    },
  });
}
