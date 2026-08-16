'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier, getUserTier } from '@/lib/subscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    }

    // Verify payment if redirected from Paystack
    const paymentRef = searchParams.get('ref');
    if (paymentRef) {
      verifyPayment(paymentRef);
    }
  }, [user, searchParams]);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        headers: {
          Authorization: `Bearer ${(await (window as any).supabase?.auth?.getSession())?.access_token || ''}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const verifyPayment = async (reference: string) => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/payments/verify?reference=${reference}`);
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Payment Successful!',
          description: 'Your subscription has been activated.',
        });
        await fetchCurrentSubscription();
        router.replace('/billing');
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Verification Failed',
          description: `Status: ${data.status}`,
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'You need to be logged in to subscribe.',
      });
      router.push('/login');
      return;
    }

    setLoading(tier);
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (error: any) {
      console.error('Subscribe error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Could not initiate payment.',
      });
    } finally {
      setLoading(null);
    }
  };

  const currentTier = currentSubscription?.tier || 'free';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock the full power of JackPass with premium features
        </p>
        {verifying && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your payment...
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {Object.values(SUBSCRIPTION_PLANS).map(plan => {
          const isCurrent = currentTier === plan.id;
          const isFree = plan.priceNaira === 0;

          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary border-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ₦{plan.priceNaira.toLocaleString()}
                  </span>
                  {!isFree && (
                    <span className="text-muted-foreground">
                      /{plan.durationDays === 365 ? 'year' : 'month'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  disabled={isCurrent || loading === plan.id || isFree}
                  onClick={() => handleSubscribe(plan.id)}
                  variant={plan.id === 'premium' ? 'default' : 'outline'}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : isFree ? (
                    'Default'
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Payments secured by Paystack • Cancel anytime</p>
      </div>
    </div>
  );
}