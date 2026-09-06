import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type FeedbackStatus = 'open' | 'planned' | 'in-progress' | 'done';

export interface FeedbackItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: FeedbackStatus;
  user_id: string | null;
  created_at: string;
  votes: number;
  myVote: boolean;
}

/** Public feedback board, sorted by votes. */
export function useFeedbackItems(category?: string) {
  return useQuery({
    queryKey: ['feedback-items', category ?? 'all'],
    queryFn: async (): Promise<FeedbackItem[]> => {
      const data = await apiFetch<{ items: FeedbackItem[] }>(
        `/api/feedback${category ? `?category=${encodeURIComponent(category)}` : ''}`
      );
      return data.items;
    },
  });
}

/** Create a feature request (authenticated). */
export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string; category?: string }) =>
      apiFetch<{ item: FeedbackItem }>('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-items'] });
    },
  });
}

/** Toggle the current user's vote on an item (authenticated). */
export function useToggleFeedbackVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ voted: boolean; votes: number }>(`/api/feedback/${id}/vote`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-items'] });
    },
  });
}

/** Update an item's status (admin only). */
export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      apiFetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback-items'] });
    },
  });
}