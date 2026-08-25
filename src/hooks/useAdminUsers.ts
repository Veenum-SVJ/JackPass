import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface AdminUser {
  id: string;
  name: string;
  avatar: string;
  is_admin: boolean;
  created_at: string;
  email: string;
  last_sign_in: string | null;
  email_confirmed: boolean;
}

/**
 * Fetch all users for admin management.
 */
export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async (): Promise<AdminUser[]> => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return apiFetch<AdminUser[]>(`/api/admin/users${params}`);
    },
  });
}

/**
 * Promote a user to admin.
 */
export function usePromoteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}/promote`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

/**
 * Demote a user from admin.
 */
export function useDemoteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch<{ success: boolean }>(`/api/admin/users/${userId}/demote`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
