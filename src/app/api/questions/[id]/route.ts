import { getQuestionById } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const question = await getQuestionById(id);
    if (question) {
      return NextResponse.json(question);
    } else {
      return new NextResponse('Question not found', { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
