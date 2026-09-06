import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useFeedbackItems,
  useCreateFeedback,
  useToggleFeedbackVote,
  useUpdateFeedbackStatus,
  type FeedbackStatus,
} from '@/hooks/useFeedback';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowBigUp, Lightbulb, SearchX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const CATEGORIES = ['General', 'Study Tools', 'Past Questions', 'Uploads', 'Community', 'Other'];

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300',
  planned: 'bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300',
  'in-progress': 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedbackBoard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>('General');

  const { data: items, isLoading } = useFeedbackItems(category === 'all' ? undefined : category);
  const createFeedback = useCreateFeedback();
  const toggleVote = useToggleFeedbackVote();
  const updateStatus = useUpdateFeedbackStatus();

  const handleCreate = async () => {
    if (title.trim().length < 5) {
      toast({ variant: 'destructive', title: 'Title too short', description: 'Please describe the feature in at least 5 characters.' });
      return;
    }
    try {
      await createFeedback.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: newCategory,
      });
      toast({ title: 'Feature Requested!', description: 'Thanks — the community can now vote on it.' });
      setTitle('');
      setDescription('');
      setNewCategory('General');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not post', description: error.message });
    }
  };

  const handleVote = async (id: string) => {
    if (!toggleVote.isPending) {
      track('feedback_upvote');
      try {
        await toggleVote.mutateAsync(id);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Vote failed', description: error.message });
      }
    }
  };

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: 'Status Updated' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Request a Feature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="What do you want the app to do? e.g. Past questions in PDF form"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
          />
          <Textarea
            placeholder="Describe the feature (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
            maxLength={2000}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={createFeedback.isPending}>
              {createFeedback.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Feature Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={category === 'all' ? 'default' : 'outline'}
          onClick={() => setCategory('all')}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? 'default' : 'outline'}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (items ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground">
            <SearchX className="h-8 w-8 mb-3" />
            <p className="font-medium text-foreground">No requests yet</p>
            <p className="text-sm mt-1">Be the first to suggest a feature for this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(items ?? []).map((item) => (
            <Card key={item.id} className="flex items-start gap-4 p-4">
              <Button
                variant={item.myVote ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col h-auto px-3 py-2 shrink-0"
                onClick={() => handleVote(item.id)}
                title={item.myVote ? 'Remove your vote' : 'Upvote'}
              >
                <ArrowBigUp className={cn('h-4 w-4', item.myVote && 'fill-current')} />
                <span className="font-bold text-sm">{item.votes}</span>
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-primary">{item.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                  <Badge className={cn('text-[10px]', STATUS_STYLES[item.status])}>
                    {item.status}
                  </Badge>
                  {isAdmin && (
                    <Select
                      value={item.status}
                      onValueChange={(v) => handleStatusChange(item.id, v as FeedbackStatus)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs ml-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">{timeAgo(item.created_at)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}