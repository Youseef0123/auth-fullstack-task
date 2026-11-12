import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends ComponentProps<'input'> {
  /** Decorative icon inside the left edge. */
  startIcon?: ReactNode;
  /** Interactive control inside the right edge, e.g. a show/hide button. */
  endSlot?: ReactNode;
}

/** 16px text on small screens prevents iOS zoom on focus. */
export function Input({ className, startIcon, endSlot, ...props }: InputProps) {
  const input = (
    <input
      className={cn(
        'block h-11 w-full rounded-xl border border-input bg-card text-base text-foreground shadow-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ring)_18%,transparent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--danger)_18%,transparent)] sm:text-sm',
        startIcon ? 'pl-10' : 'pl-3.5',
        endSlot ? 'pr-12' : 'pr-3.5',
        className,
      )}
      {...props}
    />
  );

  if (!startIcon && !endSlot) {
    return input;
  }
  return (
    <div className="relative">
      {startIcon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-muted-foreground"
        >
          {startIcon}
        </span>
      )}
      {input}
      {endSlot && (
        <div className="absolute inset-y-0 right-0 flex">{endSlot}</div>
      )}
    </div>
  );
}
