import { cn } from '@/lib/utils';

/**
 * Tier-1 JackPass brand mark: a bold rounded "J" whose hook sweeps into a
 * checkmark on an indigo rounded-square badge. Two-tone (primary + accent),
 * driven by CSS variables so it adapts to light/dark themes, and readable at
 * favicon size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="13" className="fill-primary" />
      <path
        d="M 30 9 V 23 C 30 29.5 25.5 32.5 20 31 C 16.5 30 15 27.5 15.5 24.5"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M 24 30 L 28 34 L 37 23.5"
        fill="none"
        className="stroke-accent"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <LogoMark className="h-8 w-8" />
      <span className="font-headline text-xl font-bold tracking-tight">ackPass</span>
    </span>
  );
}
