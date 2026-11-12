'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { selectStatus, useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTES } from '@/lib/routes';

/**
 * Keeps a signed-in user off /signin and /signup. The proxy redirects them on
 * every server request, but the browser's Back button replays these pages
 * from the client router cache without asking the server; the store still
 * knows the session, so this sends them back to /app.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore(selectStatus);
  const signedIn = status === 'authenticated';

  useEffect(() => {
    if (signedIn) {
      router.replace(ROUTES.home);
    }
  }, [signedIn, router]);

  if (signedIn) {
    return (
      <main
        role="status"
        className="grid min-h-dvh place-items-center text-muted-foreground"
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6 text-accent" />
          <p className="text-sm">Redirecting…</p>
        </div>
      </main>
    );
  }

  return children;
}
