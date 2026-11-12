'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ROUTES } from '@/lib/routes';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

interface ShowcaseCopy {
  eyebrow: string;
  title: string;
  highlight: string;
  body: string;
}

const COPY: Record<'signIn' | 'signUp', ShowcaseCopy> = {
  signIn: {
    eyebrow: 'Welcome back',
    title: 'Your knowledge,',
    highlight: 'ready to share.',
    body: 'Sign in to keep building the courses your whole team will actually finish.',
  },
  signUp: {
    eyebrow: 'Join in under a minute',
    title: 'Everyone has knowledge',
    highlight: 'worth sharing.',
    body: 'Create an account and turn what you know into something your colleagues can learn from.',
  },
};

const LEARNERS = [
  { initials: 'AK', color: 'bg-amber-400' },
  { initials: 'MB', color: 'bg-sky-400' },
  { initials: 'SL', color: 'bg-emerald-400' },
];

/**
 * Decorative brand panel beside the auth forms (desktop only): floating
 * "course" cards hint at what an e-learning author signs in to do.
 */
export function AuthShowcase() {
  const pathname = usePathname();
  const copy = pathname === ROUTES.signUp ? COPY.signUp : COPY.signIn;

  return (
    <aside className="relative isolate hidden overflow-hidden bg-[#0f0b2e] text-white lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-12 xl:p-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-40 size-[30rem] rounded-full bg-brand-indigo/50 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 size-[32rem] rounded-full bg-brand-fuchsia/35 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 size-80 rounded-full bg-brand-violet/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1px)] bg-size-[22px_22px]" />
      </div>

      <Logo />

      <div aria-hidden="true" className="relative mx-auto h-96 w-full max-w-md">
        <div className="absolute left-0 top-2 w-72 rotate-[-4deg] rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md motion-safe:animate-float">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-amber-300 to-pink-400 text-ink">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
                <path d="M4 20.5V5.5M9 7.5h7M9 11h5" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-white/60">Lesson 2 of 4</p>
              <p className="font-semibold">Security basics</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[68%] rounded-full bg-linear-to-r from-amber-300 to-pink-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-1">
              {LEARNERS.map(({ initials, color }) => (
                <span
                  key={initials}
                  className={`grid size-8 place-items-center rounded-full text-[10px] font-bold text-ink ring-2 ring-[#1d1650] ${color}`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="text-xs text-white/70">+128 learners</span>
          </div>
        </div>

        <div className="absolute right-0 top-24 w-64 rotate-[3deg] rounded-2xl bg-white p-4 text-ink shadow-2xl motion-safe:animate-float-slow">
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
            Quick check
          </span>
          <p className="mt-2 text-sm font-semibold leading-snug">
            Where should a session token live?
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="rounded-lg border border-zinc-200 px-3 py-1.5 text-zinc-400 line-through">
              localStorage
            </li>
            <li className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              httpOnly cookie
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </li>
          </ul>
        </div>

        <div className="absolute bottom-0 left-0 flex w-60 rotate-[-1deg] items-center gap-3 rounded-2xl border border-amber-200/40 bg-linear-to-br from-amber-200 to-amber-400 p-3.5 text-ink shadow-2xl motion-safe:animate-float [animation-delay:1.5s]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-amber-300">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-medium text-ink/70">
              Certificate earned
            </p>
            <p className="text-sm font-bold">Secure sign-in 101</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div key={pathname} className="motion-safe:animate-fade-up">
          <p className="text-sm font-medium text-white/60">{copy.eyebrow}</p>
          <p className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            {copy.title}{' '}
            <span className="bg-linear-to-r from-amber-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
              {copy.highlight}
            </span>
          </p>
          <p className="mt-4 max-w-md text-white/70">{copy.body}</p>
        </div>
        <p className="text-sm text-white/50">
          Crafted by {AUTHOR_NAME} for the {COMPANY_NAME} team
        </p>
      </div>
    </aside>
  );
}
