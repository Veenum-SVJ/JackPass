import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface ForumPost {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  category: string;
  university: string | null;
  course: string | null;
  created_at: string;
  author: string;
  votes: number;
  replies: number;
  myVote: boolean;
}

/** Public forum feed, newest first, with vote + reply counts. */
export function useForumPosts() {
  return useQuery({
    queryKey: ['forum-posts'],
    queryFn: async (): Promise<ForumPost[]> => {
      const data = await apiFetch<{ posts: ForumPost[] }>('/api/forum', {}, { auth: false });
      return data.posts;
    },
    staleTime: 30_000,
  });
}

/** Create a forum post (authenticated). */
export function useCreateForumPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description: string;
      category: string;
      university?: string;
      course?: string;
    }) =>
      apiFetch<{ post: ForumPost }>('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });
}

/** Toggle the current user's vote on a post (authenticated). */
export function useToggleForumVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ voted: boolean; votes: number }>(`/api/forum/${id}/vote`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });
}
