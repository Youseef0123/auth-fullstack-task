'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { selectLogout, useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTES } from '@/lib/routes';

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore(selectLogout);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick(): Promise<void> {
    setPending(true);
    setFailed(false);
    try {
      await logout();
      router.replace(ROUTES.signIn);
    } catch {
      // The httpOnly cookie can only be cleared by the server, so stay signed in.
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <Button
        variant="secondary"
        loading={pending}
        onClick={handleClick}
        className="w-full sm:w-auto"
      >
        Sign out
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          Couldn&apos;t sign out. Please try again.
        </p>
      )}
    </div>
  );
}
