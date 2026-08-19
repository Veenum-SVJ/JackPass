import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSubmitReview, useLecturerReviews } from '@/hooks/useLecturers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface WriteReviewFormProps {
  lecturerId: string;
}

export default function WriteReviewForm({ lecturerId }: WriteReviewFormProps) {
  const { user } = useAuth();
  const { data: reviews } = useLecturerReviews(lecturerId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [relationship, setRelationship] = useState('student');
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Check if user already has a review
  const existingReview = reviews?.find((r) => r.user_id === user?.id);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">Sign in to leave a review</p>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (existingReview) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            You've already reviewed this lecturer. You can edit your review from the list below.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    if (reviewText.trim().length < 10) {
      toast({ title: 'Review must be at least 10 characters', variant: 'destructive' });
      return;
    }

    submitReview.mutate(
      {
        lecturer_id: lecturerId,
        rating,
        relationship,
        review_text: reviewText.trim(),
        is_anonymous: isAnonymous,
      },
      {
        onSuccess: () => {
          toast({ title: 'Review submitted', description: 'Thanks for sharing your experience!' });
          setRating(0);
          setReviewText('');
          setRelationship('student');
          setIsAnonymous(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to submit review', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Write a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div>
          <Label className="text-sm font-medium">Your Rating</Label>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="p-0.5 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredStar(s)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    s <= (hoveredStar || rating)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Relationship */}
        <div>
          <Label className="text-sm font-medium">How do you know this lecturer?</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">I was their student</SelectItem>
              <SelectItem value="colleague">I'm a colleague</SelectItem>
              <SelectItem value="heard_about">I heard about them</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Review text */}
        <div>
          <Label className="text-sm font-medium">Your Review</Label>
          <Textarea
            placeholder="Share your experience — teaching style, exam patterns, what they're known for..."
            className="mt-1 min-h-[120px]"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {reviewText.length} characters (minimum 10)
          </p>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
          <Label htmlFor="anonymous" className="text-sm text-muted-foreground">
            Post anonymously
          </Label>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitReview.isPending || rating === 0}
          className="w-full"
        >
          {submitReview.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}
