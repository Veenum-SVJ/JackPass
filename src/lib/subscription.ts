/**
 * Subscription tiers and access control for JackPass.
 */
export type SubscriptionTier = 'free' | 'premium' | 'institutional';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  priceNaira: number;
  durationDays: number;
  features: string[];
  paystackPlanCode?: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic access to questions',
    priceNaira: 0,
    durationDays: 0,
    features: [
      'View approved questions',
      'Basic search and filters',
      'Access to 10 questions per day',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Full access to all features',
    priceNaira: 2000,
    durationDays: 30,
    paystackPlanCode: process.env.PAYSTACK_PREMIUM_PLAN_CODE,
    features: [
      'Unlimited question access',
      'Advanced search and filters',
      'Download questions as PDF',
      'AI-powered study recommendations',
      'Bookmark favorite questions',
      'No daily limits',
    ],
  },
  institutional: {
    id: 'institutional',
    name: 'Institutional',
    description: 'For universities and large groups',
    priceNaira: 50000,
    durationDays: 365,
    paystackPlanCode: process.env.PAYSTACK_INSTITUTIONAL_PLAN_CODE,
    features: [
      'Everything in Premium',
      'Bulk user accounts (up to 1000)',
      'Admin dashboard for institutions',
      'Custom branding',
      'Priority support',
      'API access',
      'Analytics and reporting',
    ],
  },
};

/**
 * Check if user has access to a feature based on their subscription.
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];
  return plan.features.includes(feature);
}

/**
 * Get subscription tier from user subscription record.
 */
export function getUserTier(subscription: any | null): SubscriptionTier {
  if (!subscription || subscription.status !== 'active') return 'free';
  return subscription.tier as SubscriptionTier;
}