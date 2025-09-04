import { db } from '@/lib/firebase-client';
import type { Question } from './types';
import { institutions as staticInstitutions } from './institutions';
import { collection, query, orderBy, getDocs, where, limit, doc, getDoc } from 'firebase/firestore';

export const institutions = staticInstitutions;

export const getAllQuestions = async (): Promise<Question[]> => {
  const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};

export const getApprovedQuestions = async (): Promise<Question[]> => {
  const q = query(
    collection(db, 'questions'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const docRef = doc(db, 'questions', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as Question;
};

export const getRelatedQuestions = async (currentQuestion: Question): Promise<Question[]> => {
    if (!currentQuestion) return [];
    
    // Fetch by same course
    const courseQuery = query(
        collection(db, 'questions'),
        where('status', '==', 'approved'),
        where('course', '==', currentQuestion.course),
        limit(3)
    );
    const courseSnapshot = await getDocs(courseQuery);

    // Fetch by same institution
    const institutionQuery = query(
        collection(db, 'questions'),
        where('status', '==', 'approved'),
        where('institution', '==', currentQuestion.institution),
        limit(3)
    );
    const institutionSnapshot = await getDocs(institutionQuery);

    const relatedMap = new Map<string, Question>();
    
    courseSnapshot.docs.forEach(doc => {
        if (doc.id !== currentQuestion.id) {
            relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Question)
        }
    });
    
    institutionSnapshot.docs.forEach(doc => {
        if (doc.id !== currentQuestion.id) {
            relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Question)
        }
    });

    return Array.from(relatedMap.values()).slice(0, 3);
};
