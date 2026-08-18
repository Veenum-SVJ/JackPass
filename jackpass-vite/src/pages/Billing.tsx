import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier, getUserTier } from '@/lib/subscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription, useInitiatePayment, useVerifyPayment } from '@/hooks/useSubscriptions';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data: currentSubscription } = useSubscription();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();

  useEffect(() => {
    // Verify payment if redirected from Paystack
    const paymentRef = searchParams.get('ref');
    if (paymentRef) {
      handleVerifyPayment(paymentRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleVerifyPayment = async (reference: string) => {
    setVerifying(true);
    try {
      const data = await verifyPayment.mutateAsync(reference);
      if (data.success) {
        toast({
          title: 'Payment Successful!',
          description: 'Your subscription has been activated.',
        });
        navigate('/billing', { replace: true });
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
      navigate('/login');
      return;
    }

    setLoading(tier);
    try {
      const data = await initiatePayment.mutateAsync(tier);

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

  const currentTier = getUserTier(currentSubscription ?? null);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="relative overflow-hidden text-center mb-12 rounded-3xl px-4 py-12">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative">
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
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {Object.values(SUBSCRIPTION_PLANS).map(plan => {
          const isCurrent = currentTier === plan.id;
          const isFree = plan.priceNaira === 0;
          const isPremium = plan.id === 'premium';

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative',
                !isCurrent && 'card-lift',
                isPremium
                  ? 'border-accent/70 border-2 shadow-lg'
                  : isCurrent
                    ? 'border-primary border-2'
                    : 'shadow-sm'
              )}
            >
              {isPremium && (
                <span className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full font-headline">
                  Most Popular
                </span>
              )}
              <CardHeader>
                <div className="flex items-center justify-between pr-20">
                  <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-headline">
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
                  className={cn('w-full', isPremium && 'bg-accent text-accent-foreground hover:bg-accent/90')}
                  disabled={isCurrent || loading === plan.id || isFree}
                  onClick={() => handleSubscribe(plan.id)}
                  variant={isPremium ? 'default' : 'outline'}
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
