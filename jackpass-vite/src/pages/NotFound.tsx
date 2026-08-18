import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <div className="relative">
        <h1 className="text-7xl font-bold font-headline tracking-tight bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent">404</h1>
        <p className="text-muted-foreground mt-4 max-w-md">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
