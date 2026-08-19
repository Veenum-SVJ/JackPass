import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────

export interface LecturerProfile {
  id: string;
  name: string;
  institution: string;
  faculty?: string;
  department?: string;
  country?: string;
  photo_url?: string;
  teaching_style: string[];
  known_for: string;
  rating_avg: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  courses?: string[];
  institutions?: string[];
  questionCount?: number;
}

export interface LecturerReview {
  id: string;
  lecturer_id: string;
  user_id: string;
  rating: number;
  relationship: string;
  review_text: string;
  is_anonymous: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  user_profiles?: { name: string; avatar?: string } | null;
}

export interface LecturerPhoto {
  id: string;
  lecturer_id: string;
  user_id: string;
  photo_url: string;
  caption: string;
  upvotes: number;
  is_primary: boolean;
  created_at: string;
  user?: { name: string; avatar?: string } | null;
}

// ── Lecturer hooks ───────────────────────────────────────────────────────

export function useLecturer(id: string | undefined) {
  return useQuery({
    queryKey: ['lecturer', id],
    queryFn: async (): Promise<LecturerProfile> => {
      if (!id) throw new Error('Lecturer id is required');
      return apiFetch<LecturerProfile>(`/api/lecturers/${id}`, {}, { auth: false });
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLecturers(params?: { institution?: string; q?: string }) {
  return useQuery({
    queryKey: ['lecturers', params ?? {}],
    queryFn: async (): Promise<LecturerProfile[]> => {
      const searchParams = new URLSearchParams();
      if (params?.institution) searchParams.set('institution', params.institution);
      if (params?.q) searchParams.set('q', params.q);
      const qs = searchParams.toString();
      return apiFetch<LecturerProfile[]>(`/api/lecturers${qs ? `?${qs}` : ''}`, {}, { auth: false });
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLecturerQuestions(id: string | undefined) {
  return useQuery({
    queryKey: ['lecturer-questions', id],
    queryFn: async () => {
      if (!id) return [];
      return apiFetch(`/api/lecturers/${id}/questions`, {}, { auth: false });
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Review hooks ─────────────────────────────────────────────────────────

export function useLecturerReviews(lecturerId: string | undefined) {
  return useQuery({
    queryKey: ['lecturer-reviews', lecturerId],
    queryFn: async (): Promise<LecturerReview[]> => {
      if (!lecturerId) return [];
      return apiFetch<LecturerReview[]>(
        `/api/lecturer-reviews/lecturer/${lecturerId}`,
        {},
        { auth: false }
      );
    },
    enabled: !!lecturerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      lecturer_id: string;
      rating: number;
      relationship: string;
      review_text: string;
      is_anonymous?: boolean;
    }) => {
      return apiFetch('/api/lecturer-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-reviews', variables.lecturer_id] });
      queryClient.invalidateQueries({ queryKey: ['lecturer', variables.lecturer_id] });
    },
  });
}

export function useVoteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, value }: { reviewId: string; value: 1 | -1 }) => {
      return apiFetch(`/api/lecturer-reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
    },
    onSuccess: () => {
      // Invalidate all review queries (we don't know which lecturer)
      queryClient.invalidateQueries({ queryKey: ['lecturer-reviews'] });
    },
  });
}

// ── Photo hooks ──────────────────────────────────────────────────────────

export function useLecturerPhotos(lecturerId: string | undefined) {
  return useQuery({
    queryKey: ['lecturer-photos', lecturerId],
    queryFn: async (): Promise<LecturerPhoto[]> => {
      if (!lecturerId) return [];
      return apiFetch<LecturerPhoto[]>(
        `/api/lecturer-photos/lecturer/${lecturerId}`,
        {},
        { auth: false }
      );
    },
    enabled: !!lecturerId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Flag hooks ───────────────────────────────────────────────────────────

export function useFlagContent() {
  return useMutation({
    mutationFn: async (flag: { target_type: string; target_id: string; reason: string }) => {
      return apiFetch('/api/lecturer-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag),
      });
    },
  });
}
