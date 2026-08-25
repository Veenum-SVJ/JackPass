import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalUsers: number;
}

/**
 * Fetch admin dashboard statistics.
 */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      return apiFetch<AdminStats>('/api/admin/stats');
    },
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
  });
}
