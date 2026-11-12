import type { ComponentProps } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary';

const BASE_CLASSES =
  'group inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-[background-color,box-shadow,translate] disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-size-[200%_100%] bg-left text-white shadow-[0_8px_24px_-8px_rgb(124_58_237/0.6)] hover:bg-right hover:shadow-[0_12px_28px_-8px_rgb(124_58_237/0.7)] active:translate-y-px disabled:hover:bg-left',
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
