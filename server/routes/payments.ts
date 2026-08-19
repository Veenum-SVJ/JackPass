import { Router } from 'express';
import { initializePayment, verifyPayment, generatePaymentReference, verifyWebhookSignature } from '@/lib/paystack';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/subscription';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAuth } from '../middleware';

export const paymentsRouter = Router();

/**
 * POST /api/payments/initiate
 * Initialize a Paystack payment for a subscription tier.
 */
paymentsRouter.post('/initiate', requireAuth, async (req, res) => {
  try {
    const { tier } = req.body as { tier?: string };

    if (!tier || !(tier in SUBSCRIPTION_PLANS)) {
      res.status(400).json({ error: 'Invalid subscription tier' });
      return;
    }

    const plan = SUBSCRIPTION_PLANS[tier as SubscriptionTier];
    if (plan.priceNaira === 0) {
      res.status(400).json({ error: 'Cannot initiate payment for free tier' });
      return;
    }

    const user = res.locals.user as { id: string; email?: string };

    if (!user.email) {
      res.status(400).json({ error: 'User email is required for payment' });
      return;
    }

    const supabase = createServerSupabase();

    // Generate unique reference
    const reference = generatePaymentReference(user.id, tier);

    // Save pending payment record
    await supabase.from('payments').insert({
      id: reference,
      user_id: user.id,
      tier,
      amount_naira: plan.priceNaira,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    // Initialize Paystack payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 9002}`;
    const paystackResponse = await initializePayment({
      email: user.email,
      amount: plan.priceNaira,
      reference,
      callbackUrl: `${appUrl}/billing?payment=success&ref=${reference}`,
      metadata: {
        user_id: user.id,
        tier,
        plan_name: plan.name,
      },
      planCode: plan.paystackPlanCode,
    });

    res.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
    });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
});

/**
 * GET /api/payments/verify?reference=...
 * Verify a payment by reference and update its record.
 */
paymentsRouter.get('/verify', async (req, res) => {
  try {
    const reference = typeof req.query.reference === 'string' ? req.query.reference : undefined;

    if (!reference) {
      res.status(400).json({ error: 'Reference is required' });
      return;
    }

    const verification = await verifyPayment(reference);
    const supabase = createServerSupabase();

    if (verification.data.status === 'success') {
      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: 'success',
          paid_at: new Date().toISOString(),
          paystack_response: verification.data,
        })
        .eq('id', reference);
    }

    res.json({
      success: verification.data.status === 'success',
      status: verification.data.status,
      amount: verification.data.amount / 100, // Convert from kobo
      reference: verification.data.reference,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Paystack webhook events.
 * NOTE: this route receives the RAW body so the HMAC signature can be verified.
 */
paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const rawBody = (req.body as Buffer).toString('utf8');
    const signature = req.headers['x-paystack-signature'];

    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: 'No signature' });
      return;
    }

    // Verify webhook signature against the raw body
    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = JSON.parse(rawBody);
    const supabase = createServerSupabase();

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference } = event.data;

        // Verify with Paystack
        const verification = await verifyPayment(reference);
        if (verification.data.status !== 'success') {
          console.warn(`Payment ${reference} verification failed`);
          break;
        }

        // Update payment record
        await supabase
          .from('payments')
          .update({
            status: 'success',
            paystack_response: event.data,
            paid_at: new Date().toISOString(),
          })
          .eq('id', reference);

        // Get user from payment record
        const { data: payment } = await supabase
          .from('payments')
          .select('user_id, tier')
          .eq('id', reference)
          .single();

        if (payment) {
          // Create or update subscription (30 days for now)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await supabase.from('subscriptions').upsert({
            user_id: payment.user_id,
            tier: payment.tier,
            status: 'active',
            payment_reference: reference,
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'subscription.create': {
        console.log('Subscription created:', event.data);
        break;
      }

      case 'subscription.disable': {
        const { subscription_code } = event.data;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('paystack_subscription_code', subscription_code);
        break;
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
});
