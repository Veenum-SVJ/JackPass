import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { Question } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('uploader_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch uploads for user ${userId}:`, error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return NextResponse.json(data as Question[]);
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}