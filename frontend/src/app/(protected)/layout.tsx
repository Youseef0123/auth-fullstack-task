'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  selectFetchMe,
  selectStatus,
  useAuthStore,
} from '@/features/auth/store/auth.store';
import { ROUTES } from '@/lib/routes';

/**
 * Confirms the session with the backend before rendering protected pages.
 * The proxy only checked that a cookie exists; an expired or tampered one is
 * rejected here (401) and the user is sent to /signin.
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore(selectStatus);
  const fetchMe = useAuthStore(selectFetchMe);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadSession = useCallback(() => {
    fetchMe().then(
      () => {
        if (useAuthStore.getState().status === 'unauthenticated') {
          router.replace(ROUTES.signIn);
        }
      },
      () => setLoadFailed(true),
    );
  }, [fetchMe, router]);

  useEffect(() => {
    // Right after sign-in/sign-up the store already holds the user.
    if (useAuthStore.getState().status !== 'authenticated') {
      loadSession();
    }
  }, [loadSession]);

  if (loadFailed) {
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div role="alert" className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">
            We couldn&apos;t load your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The server could not be reached. Check your connection and try
            again.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setLoadFailed(false);
              loadSession();
            }}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  if (status !== 'authenticated') {
    return (
      <main
        role="status"
        className="grid min-h-dvh place-items-center text-muted-foreground"
      >
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6 text-accent" />
          <p className="text-sm">Loading…</p>
        </div>
      </main>
    );
  }

  return children;
}
