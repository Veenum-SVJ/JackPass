'use client';

import { useState } from 'react';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, ArrowLeft, ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function QuestionView({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Dummy prev/next IDs for now. In a real app, this would be based on search context or chronological order.
  const currentId = parseInt(question.id);
  const prevId = currentId > 1 ? (currentId - 1).toString() : null;
  const nextId = currentId < 8 ? (currentId + 1).toString() : null; // Updated to max 8

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl lg:text-3xl font-headline">{question.title}</CardTitle>
                        <div className="text-sm text-muted-foreground pt-2 space-y-1">
                            <p>{question.institution} - {question.course}</p>
                            <p>{question.year} &bull; {question.semester} Semester</p>
                        </div>
                    </div>
                    {question.fileUrl && (
                        <Button asChild variant="outline">
                            <a href={question.fileUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Document
                            </a>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-lg dark:prose-invert max-w-none font-body">
                    <p>{question.fullContent}</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Lightbulb className="text-accent" />
                    Answer & Explanation
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Button onClick={() => setShowAnswer(!showAnswer)} variant="outline" className="mb-4">
                    {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
                {showAnswer && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4 animate-in fade-in-50">
                    {question.answer || question.explanation ? (
                        <>
                        {question.answer && (
                            <div>
                            <h4 className="font-bold font-headline">Answer:</h4>
                            <p className="font-code text-primary">{question.answer}</p>
                            </div>
                        )}
                        {question.explanation && (
                            <div>
                            <h4 className="font-bold font-headline mt-2">Explanation:</h4>
                            <p className="text-muted-foreground">{question.explanation}</p>
                            </div>
                        )}
                        </>
                    ) : (
                        <p className="text-muted-foreground">No answer or explanation available for this question yet.</p>
                    )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                {prevId ? <Button asChild variant="ghost"><Link href={`/questions/${prevId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Link></Button> : <div/>}
                {nextId ? <Button asChild variant="ghost"><Link href={`/questions/${nextId}`}>Next <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <div/>}
            </CardFooter>
        </Card>
    </div>
  );
}
