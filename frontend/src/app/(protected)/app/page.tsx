import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { CurrentUser } from '@/features/auth/components/current-user';
import { LogoutButton } from '@/features/auth/components/logout-button';

export const metadata: Metadata = { title: 'Home' };

export default function AppPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <Card>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome to the application.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re signed in. Your session lives in a secure, httpOnly
            cookie.
          </p>
          <div className="mt-6 flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <CurrentUser />
            <LogoutButton />
          </div>
        </Card>
      </main>
    </div>
  );
}
