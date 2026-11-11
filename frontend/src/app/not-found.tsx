import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className={buttonClassName('primary', 'mt-6')}>
          Go home
        </Link>
      </div>
    </main>
  );
}
