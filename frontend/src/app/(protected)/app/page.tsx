import type { Metadata } from 'next';
import { FitSection } from '@/app/(protected)/app/_components/fit-section';
import { HackGame } from '@/app/(protected)/app/_components/hack-game';
import { HireMeComic } from '@/app/(protected)/app/_components/hire-me-comic';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { CurrentUser } from '@/features/auth/components/current-user';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

export const metadata: Metadata = { title: 'Home' };

export default function AppPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Logo />
          <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            <span className="size-2 rounded-full bg-success" />
            Built for the {COMPANY_NAME} team
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:py-12">
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#0f0b2e] px-6 py-10 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-28 size-96 rounded-full bg-brand-indigo/60 blur-3xl" />
            <div className="absolute -bottom-32 right-0 size-[26rem] rounded-full bg-brand-fuchsia/40 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)] bg-size-[22px_22px]" />
          </div>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="motion-safe:animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
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
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Signed in securely
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                Welcome to the application.
              </h1>
              <p className="mt-4 max-w-xl text-white/70">
                This page was made for the {COMPANY_NAME} team: a comic about
                the course I built about myself, why I fit, and a mini-game
                where you try to hack this app. You will lose, politely.
              </p>
            </div>
            <Card className="text-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your account
              </p>
              <div className="mt-4 flex flex-col gap-5">
                <CurrentUser />
                <LogoutButton />
              </div>
            </Card>
          </div>
        </section>

        <HireMeComic />

        <FitSection />

        <HackGame />

        <footer className="pb-4 text-center text-sm text-muted-foreground">
          Crafted with care by {AUTHOR_NAME} for {COMPANY_NAME} · NestJS ·
          Next.js · MongoDB
        </footer>
      </main>
    </div>
  );
}
