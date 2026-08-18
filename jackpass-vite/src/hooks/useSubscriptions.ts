import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SubscriptionTier } from '@/lib/subscription';

export interface Subscription {
  id?: string;
  user_id?: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  payment_reference?: string;
  starts_at?: string;
  expires_at?: string;
}

export interface PaymentInitiateResult {
  success: boolean;
  authorization_url: string;
  reference: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: string;
  amount: number;
  reference: string;
}

/**
 * Fetch the current user's subscription (falls back to a free tier).
 */
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<Subscription> => {
      return apiFetch<Subscription>('/api/user/subscription');
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Initialize a Paystack payment for a subscription tier.
 */
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: SubscriptionTier): Promise<PaymentInitiateResult> => {
      return apiFetch<PaymentInitiateResult>('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

/**
 * Verify a Paystack payment by reference.
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string): Promise<PaymentVerifyResult> => {
      return apiFetch<PaymentVerifyResult>(
        `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
        {},
        { auth: false }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
