'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';

const TABS = [
  { href: ROUTES.signIn, label: 'Sign in' },
  { href: ROUTES.signUp, label: 'Sign up' },
] as const;

/** Segmented switch between the two auth pages; the pill slides to the active one. */
export function AuthSwitch() {
  const pathname = usePathname();
  const onSignUp = pathname === ROUTES.signUp;

  return (
    <nav
      aria-label="Account"
      className="relative grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium"
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-card shadow-sm transition-transform duration-300 ease-out',
          onSignUp && 'translate-x-full',
        )}
      />
      {TABS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-lg py-2 text-center transition-colors',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
