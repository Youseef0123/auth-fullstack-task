import type { ReactNode } from 'react';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

const AI_LOG_URL =
  'https://github.com/Youseef0123/auth-fullstack-task/blob/master/AI.md';

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-5',
} as const;

interface Match {
  icon: ReactNode;
  theirs: string;
  mine: ReactNode;
}

/** Each pair: something Easygenerator says about itself -> what this project shows. */
const MATCHES: readonly Match[] = [
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="m12 3 9 5-9 5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    ),
    theirs: 'Full-stack roles list NestJS, MongoDB and TypeScript.',
    mine: 'This app is NestJS 11 on MongoDB, with strict TypeScript from the API to the UI.',
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
      </svg>
    ),
    theirs: 'The EasyAI Agent builds a whole course from a chat.',
    mine: (
      <>
        I build software with AI agents, then review, test and question every
        step.{' '}
        <a
          href={AI_LOG_URL}
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          The full story is in AI.md
        </a>
        .
      </>
    ),
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    theirs: "Companies trust you with their people's data.",
    mine: "httpOnly cookies, argon2id hashing, and rate limits a spoofed header can't dodge.",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 12.5 9 17 20 6" />
      </svg>
    ),
    theirs: 'Experts publish fast, without cutting corners.',
    mine: '300+ automated tests, CI on every push and a one-command Docker stack, built in under two days.',
  },
];

/** "Why me": four of Easygenerator's own priorities, each matched with evidence from this app. */
export function FitSection() {
  return (
    <section aria-labelledby="fit-title">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Built like your product
      </p>
      <h2
        id="fit-title"
        className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        Why {AUTHOR_NAME} × {COMPANY_NAME}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {MATCHES.map(({ icon, theirs, mine }) => (
          <li
            key={theirs}
            className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-ring/50 hover:shadow-md"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-white shadow-sm">
              {icon}
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {COMPANY_NAME}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{theirs}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-accent">
              {AUTHOR_NAME}
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed">{mine}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
