import { NextResponse } from 'next/server';
import { initializePayment, generatePaymentReference } from '@/lib/paystack';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/subscription';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { tier } = await request.json();

    if (!tier || !(tier in SUBSCRIPTION_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[tier as SubscriptionTier];
    if (plan.priceNaira === 0) {
      return NextResponse.json(
        { error: 'Cannot initiate payment for free tier' },
        { status: 400 }
      );
    }

    // Get user from auth
    const supabase = createServerSupabase();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { createClient } = await import('@supabase/supabase-js');
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const paystackResponse = await initializePayment({
      email: user.email!,
      amount: plan.priceNaira,
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?payment=success&ref=${reference}`,
      metadata: {
        user_id: user.id,
        tier,
        plan_name: plan.name,
      },
      planCode: plan.paystackPlanCode,
    });

    return NextResponse.json({
      success: true,
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
    });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}