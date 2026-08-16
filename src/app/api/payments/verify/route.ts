import { NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/paystack';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
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

    return NextResponse.json({
      success: verification.data.status === 'success',
      status: verification.data.status,
      amount: verification.data.amount / 100, // Convert from kobo
      reference: verification.data.reference,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}