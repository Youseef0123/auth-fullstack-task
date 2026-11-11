import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** 16px text on small screens prevents iOS zoom on focus. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'block h-10 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:outline-danger sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}
