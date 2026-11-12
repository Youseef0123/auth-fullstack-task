import type { ReactNode } from 'react';
import { AuthShowcase } from '@/app/(auth)/_components/auth-showcase';
import { AuthSwitch } from '@/app/(auth)/_components/auth-switch';
import { GuestGuard } from '@/app/(auth)/_components/guest-guard';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AuthShowcase />

        <div className="relative flex min-h-dvh flex-col">
          <div className="absolute right-6 top-6 hidden lg:block">
            <ThemeToggle />
          </div>
          <header className="relative isolate overflow-hidden bg-[#0f0b2e] px-5 pb-7 pt-6 text-white lg:hidden">
            <div aria-hidden="true" className="absolute inset-0 -z-10">
              <div className="absolute -left-16 -top-20 size-56 rounded-full bg-brand-indigo/60 blur-3xl" />
              <div className="absolute -bottom-24 right-0 size-60 rounded-full bg-brand-fuchsia/40 blur-3xl" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Logo />
              <ThemeToggle tone="onDark" />
            </div>
            <p className="mt-4 text-lg font-semibold leading-snug">
              Everyone has knowledge{' '}
              <span className="bg-linear-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
                worth sharing.
              </span>
            </p>
          </header>

          <main className="flex flex-1 flex-col px-5 pb-10 pt-8 sm:px-10 lg:justify-center lg:py-10">
            <div className="mx-auto w-full max-w-[400px]">
              <AuthSwitch />
              <div className="mt-8 motion-safe:animate-fade-up">{children}</div>
            </div>
          </main>

          <p className="flex items-center justify-center gap-1.5 px-5 pb-6 text-xs text-muted-foreground">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" />
            </svg>
            Sessions use an httpOnly cookie; passwords are hashed with argon2id.
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
