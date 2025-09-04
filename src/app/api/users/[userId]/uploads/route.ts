import { db } from '@/lib/firebase-client';
import { NextResponse } from 'next/server';
import type { Question } from '@/lib/types';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  // In a real app, this would be the authenticated user's ID.
  // Here we use the email as a stand-in for the user ID, which is passed in the URL.
  const { userId } = await params;

  try {
    const q = query(
      collection(db, 'questions'),
      where('uploaderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
        
    const uploads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    
    return NextResponse.json(uploads);
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
