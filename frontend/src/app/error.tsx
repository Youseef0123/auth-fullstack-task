'use client';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  reset: () => void;
}

/** Last-resort boundary for unexpected render errors. */
export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div role="alert" className="max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
