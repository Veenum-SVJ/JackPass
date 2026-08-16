import { NextResponse } from 'next/server';
import { verifyPayment, verifyWebhookSignature } from '@/lib/paystack';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createServerSupabase();

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, customer, plan, amount } = event.data;

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
          // Create or update subscription
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + (plan ? 30 : 30)); // 30 days for now

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}