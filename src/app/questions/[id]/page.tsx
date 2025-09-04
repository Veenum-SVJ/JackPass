import { getQuestionById, getRelatedQuestions } from '@/lib/data';
import QuestionView from '@/components/QuestionView';
import { notFound } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import type { Metadata } from 'next';
import { db } from '@/lib/firebase-client';
import type { Question } from '@/lib/types';
import { collection, limit, getDocs, query } from 'firebase/firestore';

type Props = {
  params: { id: string }
}

async function getQuestion(id: string) {
  const question = await getQuestionById(id);
  if (!question) {
    return null;
  }
  return question;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = await getQuestion(params.id);
 
  if (!question) {
    return {
      title: 'Question Not Found | JackPass',
    }
  }

  return {
    title: `${question.title} | JackPass`,
    description: `View the past question for ${question.course} from ${question.institution}.`,
  }
}

export async function generateStaticParams() {
  const q = query(collection(db, 'questions'), limit(20));
  const snapshot = await getDocs(q);
  const paths = snapshot.docs.map((doc) => ({
    id: doc.id,
  }));
  return paths;
}

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const question = await getQuestion(params.id);
  
  if (!question) {
    notFound();
  }

  const relatedQuestions = await getRelatedQuestions(question);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-4 pb-24">
      <div className="flex-grow lg:w-2/3">
        <QuestionView question={question} />
      </div>
      <aside className="lg:w-1/3 lg:sticky top-24 self-start">
        <h2 className="text-2xl font-bold mb-4 font-headline">Related Questions</h2>
        <div className="space-y-4">
          {relatedQuestions.slice(0, 3).map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </aside>
    </div>
  );
}
