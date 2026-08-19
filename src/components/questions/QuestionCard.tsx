import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Question } from '@/lib/types';
import { Calendar, School2 } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Link to={`/questions/${question.id}`} className="block group">
      <Card className="card-lift hover:border-primary h-full flex flex-col bg-card/50 hover:bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-headline group-hover:text-primary transition-colors break-words">{question.title}</CardTitle>
          <CardDescription className="flex items-center gap-2 pt-2 text-sm">
            <School2 className="w-4 h-4 text-muted-foreground" />
            <span>{question.institution}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{question.contentPreview}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{question.year} - {question.semester}</span>
          </div>
          <Badge variant="secondary">{question.type}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
