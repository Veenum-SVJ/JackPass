import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MoreHorizontal, GraduationCap, Users, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useVoteReview, useFlagContent } from '@/hooks/useLecturers';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    relationship: string;
    review_text: string;
    is_anonymous: boolean;
    upvotes: number;
    downvotes: number;
    created_at: string;
    user_profiles?: { name: string; avatar?: string } | null;
  };
}

const relationshipIcons: Record<string, typeof GraduationCap> = {
  student: GraduationCap,
  colleague: Users,
  heard_about: Volume2,
};

const relationshipLabels: Record<string, string> = {
  student: 'Student',
  colleague: 'Colleague',
  heard_about: 'Heard about',
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const voteMutation = useVoteReview();
  const flagMutation = useFlagContent();

  const voteScore = review.upvotes - review.downvotes;
  const RelationshipIcon = relationshipIcons[review.relationship] || GraduationCap;
  const displayName = review.is_anonymous
    ? 'Anonymous'
    : review.user_profiles?.name || 'Student';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleVote = (value: 1 | -1) => {
    if (userVote === value) return;
    setUserVote(value);
    voteMutation.mutate({ reviewId: review.id, value });
  };

  const handleFlag = () => {
    flagMutation.mutate(
      {
        target_type: 'review',
        target_id: review.id,
        reason: 'Reported by community member',
      },
      {
        onSuccess: () => toast({ title: 'Review flagged', description: 'Our team will review this.' }),
        onError: () => toast({ title: 'Could not flag', variant: 'destructive' }),
      }
    );
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex gap-4">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${userVote === 1 ? 'text-primary' : ''}`}
              onClick={() => handleVote(1)}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium tabular-nums">{voteScore}</span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${userVote === -1 ? 'text-destructive' : ''}`}
              onClick={() => handleVote(-1)}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                      <RelationshipIcon className="h-3 w-3 mr-1" />
                      {relationshipLabels[review.relationship] || review.relationship}
                    </Badge>
                    <span>•</span>
                    <time>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</time>
                  </div>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted'}`}
                  />
                ))}
              </div>
            </div>

            {/* Review text */}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.review_text}
            </p>

            {/* Flag button */}
            <div className="mt-3 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleFlag} className="text-destructive cursor-pointer">
                    <Flag className="mr-2 h-3.5 w-3.5" />
                    Flag this review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
