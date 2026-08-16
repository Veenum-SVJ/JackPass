/**
 * Paystack API client for Nigerian payment processing.
 * Docs: https://paystack.com/docs/api/
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'abandoned' | 'failed';
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      email: string;
      customer_code: string;
    };
    plan?: {
      plan_code: string;
      name: string;
    };
    subscription_code?: string;
  };
}

/**
 * Initialize a payment transaction with Paystack.
 */
export async function initializePayment(params: {
  email: string;
  amount: number; // Amount in Naira (will be converted to kobo)
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  planCode?: string;
}): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Convert to kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      plan: params.planCode,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Verify a payment transaction by reference.
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create a subscription (recurring payment) with Paystack.
 */
export async function createSubscription(params: {
  customer: string; // customer_code from Paystack
  planCode: string;
}): Promise<any> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/subscription`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: params.customer,
      plan: params.planCode,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate a unique payment reference.
 */
export function generatePaymentReference(userId: string, tier: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `JP-${tier}-${userId.slice(0, 8)}-${timestamp}-${random}`;
}

/**
 * Verify Paystack webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY || '')
    .update(body)
    .digest('hex');
  return hash === signature;
}