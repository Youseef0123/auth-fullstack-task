import type { ComponentProps } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary';

const BASE_CLASSES =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover disabled:hover:bg-primary',
  secondary:
    'border border-border bg-card text-foreground shadow-xs hover:bg-muted disabled:hover:bg-card',
};

/** Shared with links that should look like buttons. */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  className?: string,
): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], className);
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  /** Disables the button and shows a spinner. */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName(variant, className)}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
