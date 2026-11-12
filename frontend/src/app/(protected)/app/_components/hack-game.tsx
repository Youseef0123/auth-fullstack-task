'use client';

import { useState } from 'react';
import { Certificate } from '@/app/(protected)/app/_components/certificate';
import { selectUser, useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { http } from '@/lib/http';
import { ACCESS_TOKEN_COOKIE } from '@/lib/session-cookie';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

interface AttackOutcome {
  lines: string[];
  verdict: string;
  quip: string;
  blocked: boolean;
}

interface Attack {
  id: string;
  title: string;
  move: string;
  /** Live attacks really hit this app's API; simulated ones only tell the story. */
  live: boolean;
  run: () => Promise<AttackOutcome>;
}

type AttackState =
  | { status: 'ready' }
  | { status: 'running' }
  | { status: 'done'; outcome: AttackOutcome };

/** Enough wrong guesses to cross any configured sign-in limit (Docker 5, local dev 20). */
const MAX_ATTEMPTS = 40;
const PROBE_EMAIL = 'definitely.not.a.hacker@example.com';

const UNREACHABLE: AttackOutcome = {
  lines: ['→ no answer from the server'],
  verdict:
    'The attack never reached the server. Check your connection and try again.',
  quip: 'Even the hackers have Wi-Fi problems.',
  blocked: false,
};

async function statusOf(request: Promise<unknown>): Promise<number> {
  try {
    await request;
    return 200;
  } catch (error) {
    return ApiError.from(error).statusCode;
  }
}

/** Keeps long attack logs readable: the first three and last two lines. */
function condense(lines: string[]): string[] {
  return lines.length > 6
    ? [
        ...lines.slice(0, 3),
        `… ${lines.length - 5} more attempts …`,
        ...lines.slice(-2),
      ]
    : lines;
}

/** Signs in with wrong passwords until the rate limiter answers 429. */
async function hammerSignIn(
  describe: (attempt: number) => string,
  headers: (attempt: number) => Record<string, string>,
): Promise<{ lines: string[]; attempts: number } | null> {
  const lines: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const status = await statusOf(
      http.post(
        '/auth/signin',
        { email: PROBE_EMAIL, password: `guess-${attempt}` },
        { headers: headers(attempt) },
      ),
    );
    if (status === 0 || status >= 500) {
      return null;
    }
    lines.push(`${describe(attempt)} → ${status}`);
    if (status === 429) {
      return { lines: condense(lines), attempts: attempt };
    }
  }
  return { lines: condense(lines), attempts: MAX_ATTEMPTS + 1 };
}

const ATTACKS: readonly Attack[] = [
  {
    id: 'cookie',
    title: 'Steal the session cookie',
    move: 'Read document.cookie, the classic XSS move.',
    live: true,
    run: async () => {
      const stolen = document.cookie
        .split('; ')
        .some((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
      return {
        lines: [
          '> document.cookie',
          stolen
            ? `→ ${ACCESS_TOKEN_COOKIE} found`
            : `→ no ${ACCESS_TOKEN_COOKIE} in sight`,
        ],
        verdict: stolen
          ? 'The token was readable. That should never happen.'
          : 'Blocked: the session cookie is httpOnly, so JavaScript never sees it.',
        quip: 'The robot is still hugging that cookie.',
        blocked: !stolen,
      };
    },
  },
  {
    id: 'brute-force',
    title: 'Brute-force a password',
    move: 'Hammer the sign-in endpoint with wrong guesses.',
    live: true,
    run: async () => {
      const result = await hammerSignIn(
        (attempt) => `> POST /api/auth/signin  guess #${attempt}`,
        () => ({}),
      );
      if (!result) {
        return UNREACHABLE;
      }
      const { lines, attempts } = result;
      return {
        lines,
        verdict:
          attempts > MAX_ATTEMPTS
            ? 'No rate limit kicked in. That should never happen.'
            : attempts === 1
              ? 'Blocked at once: the rate limiter still remembers your last run.'
              : `Blocked after ${attempts - 1} wrong guesses: 429 Too Many Requests.`,
        quip: "Maybe try 'password123'? Kidding, that's blocked too.",
        blocked: attempts <= MAX_ATTEMPTS,
      };
    },
  },
  {
    id: 'spoof',
    title: 'Pretend to be someone else',
    move: 'Send a new fake X-Forwarded-For on every request.',
    live: true,
    run: async () => {
      const result = await hammerSignIn(
        (attempt) => `> X-Forwarded-For: 203.0.113.${attempt}`,
        (attempt) => ({ 'X-Forwarded-For': `203.0.113.${attempt}` }),
      );
      if (!result) {
        return UNREACHABLE;
      }
      return {
        lines: result.lines,
        verdict:
          result.attempts > MAX_ATTEMPTS
            ? 'The fake addresses dodged the limit. That should never happen.'
            : "Blocked: a header you set yourself doesn't change who you are.",
        quip: 'Nice disguise. The server still recognised you.',
        blocked: result.attempts <= MAX_ATTEMPTS,
      };
    },
  },
  {
    id: 'admin',
    title: 'Sign up as an admin',
    move: 'Sneak role: "admin" into the sign-up request.',
    live: true,
    run: async () => {
      const request = `> POST /api/auth/signup { …, role: "admin" }`;
      try {
        await http.post('/auth/signup', {
          name: 'Wannabe Admin',
          email: `wannabe.admin.${Date.now()}@example.com`,
          password: 'Adm1n!please',
          role: 'admin',
        });
        return {
          lines: [request, '→ 201 Created'],
          verdict: 'The extra field was accepted. That should never happen.',
          quip: 'Uh-oh.',
          blocked: false,
        };
      } catch (error) {
        const apiError = ApiError.from(error);
        if (apiError.statusCode === 0 || apiError.statusCode >= 500) {
          return UNREACHABLE;
        }
        return {
          lines: [
            request,
            `→ ${apiError.statusCode} ${apiError.messages[0] ?? apiError.message}`,
          ],
          verdict:
            apiError.statusCode === 429
              ? 'Blocked: too many sign-ups from you already.'
              : 'Blocked: unknown fields like "role" are rejected before anything is saved.',
          quip: 'Everyone wants to be admin. Nobody gets to be.',
          blocked: true,
        };
      }
    },
  },
  {
    id: 'database',
    title: 'Steal the password database',
    move: 'Assume the worst: the hashes leak.',
    live: false,
    run: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        lines: [
          '> db.users.findOne({}, { password: 1 })',
          '→ "$argon2id$v=19$m=65536,t=3,p=4$Wc9X…"',
          '> crack --wordlist leaked-passwords.txt',
          '→ estimated time: longer than your career',
        ],
        verdict:
          'Blocked: passwords are argon2id hashes, slow to crack by design.',
        quip: 'Bring snacks. Lots of snacks.',
        blocked: true,
      };
    },
  },
];

const MOODS = [
  'Unstoppable',
  'Still confident',
  'Sweating',
  'Googling things',
  'Updating LinkedIn',
  'Gave up',
] as const;

function initialStates(): Record<string, AttackState> {
  return Object.fromEntries(ATTACKS.map(({ id }) => [id, { status: 'ready' }]));
}

/** A playful security demo: real attacks against this very API, all of them blocked. */
export function HackGame() {
  const user = useAuthStore(selectUser);
  const [states, setStates] = useState(initialStates);
  const [activeId, setActiveId] = useState<string | null>(null);

  const blockedCount = ATTACKS.filter(({ id }) => {
    const state = states[id];
    return state.status === 'done' && state.outcome.blocked;
  }).length;
  const running = Object.values(states).some((s) => s.status === 'running');
  const finished = blockedCount === ATTACKS.length;
  const confidence = 100 - (blockedCount / ATTACKS.length) * 100;
  const active = ATTACKS.find(({ id }) => id === activeId);
  const activeState = activeId ? states[activeId] : undefined;

  async function launch(attack: Attack): Promise<void> {
    setActiveId(attack.id);
    setStates((current) => ({
      ...current,
      [attack.id]: { status: 'running' },
    }));
    const outcome = await attack.run();
    setStates((current) => ({
      ...current,
      [attack.id]: { status: 'done', outcome },
    }));
  }

  function restart(): void {
    setStates(initialStates());
    setActiveId(null);
  }

  return (
    <section
      aria-labelledby="game-title"
      className="relative isolate overflow-hidden rounded-3xl bg-[#0f0b2e] p-6 text-white sm:p-8"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-fuchsia/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-brand-indigo/40 blur-3xl" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
        Mini-game · real attacks against this server
      </p>
      <h2
        id="game-title"
        className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        Hack this app{' '}
        <span className="bg-linear-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
          (you&apos;ll lose)
        </span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-white/70">
        Pick an attack. The live ones really run against the API you are signed
        in to, so the replies you see are real. Spoiler: {AUTHOR_NAME}&apos;s
        defences hold.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-white/60">
          Hacker confidence
        </span>
        <div
          aria-hidden="true"
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-red-500 via-fuchsia-500 to-amber-300 transition-[width] duration-700"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span
          aria-live="polite"
          className="w-36 shrink-0 text-right text-sm font-semibold text-amber-300"
        >
          {MOODS[blockedCount]}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <ol className="grid gap-2.5">
          {ATTACKS.map((attack, index) => {
            const state = states[attack.id];
            const done = state.status === 'done';
            const blocked = done && state.outcome.blocked;
            return (
              <li key={attack.id}>
                <button
                  type="button"
                  onClick={() => void launch(attack)}
                  disabled={running || blocked}
                  aria-label={`Launch attack: ${attack.title}`}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default',
                    blocked
                      ? 'border-emerald-400/40 bg-emerald-400/10'
                      : 'border-white/15 bg-white/5 hover:border-amber-300/60 hover:bg-white/10',
                    activeId === attack.id && !blocked && 'border-amber-300/70',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{attack.title}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          attack.live
                            ? 'bg-red-500/20 text-red-200'
                            : 'bg-white/10 text-white/60',
                        )}
                      >
                        {attack.live ? 'Live' : 'Simulated'}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-white/60">
                      {attack.move}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold',
                      blocked ? 'text-emerald-300' : 'text-white/50',
                    )}
                  >
                    {state.status === 'running'
                      ? 'Running…'
                      : blocked
                        ? 'Blocked ✓'
                        : done
                          ? 'Retry'
                          : 'Launch'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex min-h-64 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 font-mono text-[13px]">
          <div
            aria-hidden="true"
            className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5"
          >
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-white/40">hacker@laptop ~</span>
          </div>
          <div role="log" aria-live="polite" className="flex-1 space-y-1 p-4">
            {!active || !activeState ? (
              <p className="text-white/50">$ waiting for your first attack_</p>
            ) : activeState.status === 'running' ? (
              <p className="text-amber-300">
                $ {active.title.toLowerCase()} … running
              </p>
            ) : activeState.status === 'done' ? (
              <>
                {activeState.outcome.lines.map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className="break-all text-emerald-300"
                  >
                    {line}
                  </p>
                ))}
                <p
                  className={cn(
                    'pt-3 font-sans text-sm font-semibold',
                    activeState.outcome.blocked
                      ? 'text-emerald-300'
                      : 'text-red-300',
                  )}
                >
                  {activeState.outcome.verdict}
                </p>
                <p className="font-sans text-sm text-white/60">
                  {activeState.outcome.quip}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {finished && (
        <div className="mt-8">
          <Certificate
            title="Certificate of attempted hacking"
            name={user?.name ?? 'You'}
            footnote={`Defences by ${AUTHOR_NAME}, built for the ${COMPANY_NAME} team`}
            restartLabel="Play again"
            onRestart={restart}
          >
            launched {ATTACKS.length} attacks against this app and got exactly{' '}
            <span className="font-semibold text-ink">0</span> in. Defences held:{' '}
            {blockedCount}/{ATTACKS.length}.
          </Certificate>
        </div>
      )}
    </section>
  );
}
