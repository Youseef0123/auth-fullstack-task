'use client';

import type { ReactNode } from 'react';
import { selectUser, useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/lib/cn';
import { comicFont } from '@/lib/fonts';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

const INK = '#18181b';

interface Look {
  skin: string;
  hair: string;
  shirt: string;
}

/** A limb with a comic outline: a thick ink stroke under a thinner coloured one. */
function limb(d: string, color: string, width = 11): ReactNode {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={width + 6} />
      <path d={d} stroke={color} strokeWidth={width} />
    </g>
  );
}

function hand(x: number, y: number, skin: string): ReactNode {
  return (
    <circle cx={x} cy={y} r="7.5" fill={skin} stroke={INK} strokeWidth="3" />
  );
}

/** Head and shoulders standing on y=0, centred on x=0; `arms` sit between body and head. */
function character(
  { skin, hair, shirt }: Look,
  arms?: ReactNode,
  face?: ReactNode,
): ReactNode {
  return (
    <g
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M-38 0 Q-38 -58 0 -62 Q38 -58 38 0 Z" fill={shirt} />
      <path d="M-12 -61 Q0 -50 12 -61" fill="none" />
      {arms}
      <circle cx="0" cy="-92" r="27" fill={skin} />
      <path
        d="M-28 -95 C-30 -124 -4 -129 8 -121 C22 -127 31 -111 28 -95 C18 -106 6 -104 -4 -110 C-11 -102 -20 -100 -28 -95 Z"
        fill={hair}
      />
      <circle cx="-9" cy="-90" r="2.8" fill={INK} stroke="none" />
      <circle cx="9" cy="-90" r="2.8" fill={INK} stroke="none" />
      <path d="M-8 -80 Q0 -72 8 -80" fill="none" />
      <circle
        cx="-17"
        cy="-82"
        r="4"
        fill="#f87171"
        fillOpacity="0.35"
        stroke="none"
      />
      <circle
        cx="17"
        cy="-82"
        r="4"
        fill="#f87171"
        fillOpacity="0.35"
        stroke="none"
      />
      {face}
    </g>
  );
}

function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spikes: number,
): string {
  return Array.from({ length: spikes * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI * index) / spikes - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

const SAM: Look = { skin: '#f2c6a0', hair: '#7c2d12', shirt: '#2563eb' };
const DEV: Look = { skin: '#c68b59', hair: '#1c1917', shirt: '#0f766e' };
const LEARNERS: readonly (Look & { x: number; scale: number })[] = [
  { x: 78, scale: 0.92, skin: '#8d5a3b', hair: '#111827', shirt: '#db2777' },
  { x: 200, scale: 1.04, skin: '#f7d7b9', hair: '#ca8a04', shirt: '#7c3aed' },
  { x: 322, scale: 0.92, skin: '#e0ac69', hair: '#3f3f46', shirt: '#ea580c' },
];

const EXPERT_ART = (
  <>
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <rect x="34" y="262" width="150" height="26" rx="4" fill="#ef4444" />
      <rect x="46" y="238" width="128" height="24" rx="4" fill="#14b8a6" />
      <rect x="40" y="214" width="116" height="24" rx="4" fill="#f59e0b" />
      <path
        d="M48 275h120M58 250h104M52 226h92"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="2.5"
      />
      <rect x="112" y="186" width="30" height="28" rx="5" fill="#fff" />
      <path d="M142 193q11 0 11 8.5t-11 8.5" fill="none" />
      <path
        d="M120 176q-4-6 0-12M132 176q-4-6 0-12"
        fill="none"
        strokeWidth="2.5"
      />
    </g>
    <g transform="translate(285 300) scale(1.3)">
      {character(
        SAM,
        <>
          {limb('M22 -50 Q50 -78 33 -116', SAM.shirt)}
          {hand(33, -116, SAM.skin)}
        </>,
      )}
    </g>
    <g stroke={INK} strokeWidth="3">
      <circle cx="318" cy="112" r="6" fill="#fff" />
      <circle cx="328" cy="94" r="9" fill="#fff" />
      <path
        d="M318 64c-12-2-16-22-2-27 2-14 22-18 30-6 10-10 30-4 30 10 14 2 14 24 0 26-4 12-24 14-30 4-8 8-26 6-28-7z"
        fill="#fff"
      />
      <circle cx="346" cy="52" r="12" fill="#fde047" />
      <rect x="340" y="63" width="12" height="9" rx="2" fill="#a1a1aa" />
    </g>
    <g stroke={INK} strokeWidth="2.5" strokeLinecap="round">
      <path d="M346 30v-6M328 38l-4-4M364 38l4-4" />
    </g>
  </>
);

const AUTHORING_ART = (
  <>
    <g transform="translate(108 300) scale(1.25)">{character(SAM)}</g>
    <rect
      x="-4"
      y="236"
      width="408"
      height="70"
      fill="#a16207"
      stroke={INK}
      strokeWidth="3"
    />
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <rect x="196" y="116" width="156" height="110" rx="9" fill="#1e1b4b" />
      <rect
        x="208"
        y="128"
        width="132"
        height="13"
        rx="4"
        fill="#7c3aed"
        stroke="none"
      />
      <rect
        x="208"
        y="149"
        width="88"
        height="7"
        rx="3"
        fill="#e4e4e7"
        stroke="none"
      />
      <rect
        x="208"
        y="161"
        width="110"
        height="7"
        rx="3"
        fill="#e4e4e7"
        stroke="none"
      />
      <rect
        x="208"
        y="176"
        width="132"
        height="40"
        rx="6"
        fill="#fff"
        stroke="none"
      />
      <circle
        cx="220"
        cy="188"
        r="5"
        fill="none"
        stroke="#a1a1aa"
        strokeWidth="2"
      />
      <rect
        x="230"
        y="185"
        width="70"
        height="6"
        rx="3"
        fill="#d4d4d8"
        stroke="none"
      />
      <circle cx="220" cy="204" r="5" fill="#22c55e" stroke="none" />
      <rect
        x="230"
        y="201"
        width="90"
        height="6"
        rx="3"
        fill="#86efac"
        stroke="none"
      />
      <path d="M184 238 L196 226 H352 L364 238 Z" fill="#d4d4d8" />
    </g>
    <g transform="translate(108 300) scale(1.25)">
      {limb('M28 -46 Q56 -28 72 -52', SAM.shirt)}
      {hand(72, -52, SAM.skin)}
    </g>
    <polygon
      points={starPoints(334, 64, 46, 28, 12)}
      fill="#fde047"
      stroke={INK}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </>
);

const LEARNERS_ART = (
  <>
    <g fill="none" strokeWidth="5" strokeLinecap="round">
      <path d="M40 150l10 6" stroke="#db2777" />
      <path d="M150 140l-8 9" stroke="#7c3aed" />
      <path d="M262 150l9-5" stroke="#ea580c" />
      <path d="M372 165l-6 9" stroke="#2563eb" />
      <path d="M118 178l7 7" stroke="#ca8a04" />
    </g>
    {LEARNERS.map((look) => (
      <g
        key={look.x}
        transform={`translate(${look.x} 300) scale(${look.scale})`}
      >
        {character(
          look,
          <>
            {limb('M-27 -42 Q-28 -16 -14 -12', look.shirt)}
            {limb('M27 -42 Q28 -16 14 -12', look.shirt)}
            <rect x="-15" y="-52" width="30" height="44" rx="6" fill={INK} />
            <rect
              x="-11"
              y="-48"
              width="22"
              height="32"
              rx="3"
              fill="#fff"
              stroke="none"
            />
            <path
              d="M-6 -32l4 4 8-9"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3.5"
            />
            {hand(-14, -12, look.skin)}
            {hand(14, -12, look.skin)}
          </>,
        )}
      </g>
    ))}
  </>
);

const DEVELOPER_ART = (
  <>
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <path
        d="M100 82 L160 104 V160 C160 200 132 228 100 244 C68 228 40 200 40 160 V104 Z"
        fill="#4f46e5"
      />
      <path
        d="M86 150 V138 a14 14 0 0 1 28 0 V150"
        fill="none"
        strokeWidth="6"
      />
      <rect x="76" y="148" width="48" height="38" rx="7" fill="#fde047" />
      <circle cx="100" cy="163" r="4.5" fill={INK} stroke="none" />
      <rect
        x="98"
        y="165"
        width="4"
        height="11"
        rx="2"
        fill={INK}
        stroke="none"
      />
    </g>
    <g fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M30 74l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
      <path d="M172 214l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </g>
    <g transform="translate(292 300) scale(1.3)">
      {character(
        DEV,
        <>
          {limb('M-26 -48 Q-52 -62 -76 -66', DEV.shirt)}
          <g stroke={INK} strokeWidth="3">
            <path d="M-82 -66 H-122" fill="none" strokeWidth="9" />
            <path
              d="M-82 -66 H-122"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
            />
            <path d="M-112 -66 v8 M-102 -66 v6" fill="none" strokeWidth="3.5" />
            <circle cx="-86" cy="-66" r="9" fill="#fbbf24" />
          </g>
          {hand(-76, -66, DEV.skin)}
        </>,
        <g fill="#fff" fillOpacity="0.25">
          <circle cx="-10" cy="-90" r="8" />
          <circle cx="10" cy="-90" r="8" />
          <path d="M-2 -90 H2" fill="none" />
        </g>,
      )}
    </g>
  </>
);

type Tail = 'left' | 'center' | 'right';

interface Panel {
  background: string;
  caption: string;
  bubble: string;
  /** Position of the speech bubble in % of the panel. */
  box: { left: string; top: string; width: string };
  tail: Tail;
  description: string;
  art: ReactNode;
  sfx?: string;
}

const TAIL_CLASS: Record<Tail, string> = {
  left: 'after:left-[16%]',
  center: 'after:left-[45%]',
  right: 'after:right-[16%]',
};

/**
 * A four-panel comic for the Easygenerator team: an expert turns knowledge
 * into a course, colleagues learn, and the final panel greets the signed-in user.
 */
export function WelcomeComic() {
  const user = useAuthStore(selectUser);
  const firstName = user?.name.trim().split(/\s+/)[0] ?? 'there';

  const panels: readonly Panel[] = [
    {
      background: 'bg-amber-200',
      caption: 'Meet Sam, the expert',
      bubble:
        'I know this stuff inside out… but how do I teach 500 colleagues?',
      box: { left: '4%', top: '22%', width: '50%' },
      tail: 'right',
      description:
        'Sam scratches his head under a thought bubble with a lightbulb.',
      art: EXPERT_ART,
    },
    {
      background: 'bg-sky-200',
      caption: `Sam opens ${COMPANY_NAME}`,
      bubble: 'Drag, drop, publish. No instructional-design degree needed!',
      box: { left: '3%', top: '20%', width: '47%' },
      tail: 'left',
      description: 'Sam builds a course with lessons and a quiz on his laptop.',
      art: AUTHORING_ART,
      sfx: 'Click!',
    },
    {
      background: 'bg-emerald-200',
      caption: 'Meanwhile, across the company…',
      bubble: 'Done in five minutes, and I actually get it!',
      box: { left: '46%', top: '22%', width: '50%' },
      tail: 'left',
      description:
        'Three colleagues finish the course on their phones, each with a green check mark.',
      art: LEARNERS_ART,
    },
    {
      background: 'bg-violet-200',
      caption: 'And behind the login…',
      bubble: `I'm ${AUTHOR_NAME}. I built the secure way in. Welcome, ${firstName}!`,
      box: { left: '42%', top: '17%', width: '55%' },
      tail: 'center',
      description: `${AUTHOR_NAME} hands over a golden key next to a shield with a padlock.`,
      art: DEVELOPER_ART,
    },
  ];

  return (
    <section aria-labelledby="comic-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="comic-title"
          className={cn(
            comicFont.className,
            'text-4xl tracking-wide sm:text-5xl',
          )}
        >
          Knowledge sharing,{' '}
          <span className="bg-linear-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent">
            made easy
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          A four-panel story for the {COMPANY_NAME} team
        </p>
      </div>

      <ol className="mt-6 grid gap-5 sm:grid-cols-2">
        {panels.map((panel, index) => (
          <li
            key={panel.caption}
            className={cn(
              'relative aspect-4/3 overflow-hidden rounded-xl border-[3px] border-ink bg-[radial-gradient(rgb(0_0_0/0.09)_1.2px,transparent_1.4px)] bg-size-[10px_10px] shadow-[6px_6px_0_rgb(124_58_237/0.35)] @container motion-safe:transition-transform motion-safe:hover:-rotate-1 motion-safe:hover:scale-[1.015]',
              panel.background,
              index % 2 === 0 ? 'sm:rotate-[-0.6deg]' : 'sm:rotate-[0.6deg]',
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 400 300"
              className="absolute inset-0 size-full"
            >
              {panel.art}
            </svg>
            <p className="sr-only">{panel.description}</p>
            <p
              className={cn(
                comicFont.className,
                'absolute left-[3%] top-[4%] -rotate-2 border-2 border-ink bg-amber-300 px-[1.8cqw] py-[0.5cqw] text-[3.8cqw] tracking-wide text-ink shadow-[0.6cqw_0.6cqw_0_var(--color-ink)]',
              )}
            >
              {panel.caption}
            </p>
            {panel.sfx && (
              <p
                aria-hidden="true"
                className={cn(
                  comicFont.className,
                  'absolute right-[9.5%] top-[16%] rotate-[-10deg] text-[6cqw] text-red-600',
                )}
              >
                {panel.sfx}
              </p>
            )}
            <p
              className={cn(
                'absolute rounded-[3cqw] border-2 border-ink bg-white px-[2.6cqw] py-[1.8cqw] text-[3.6cqw] font-semibold leading-[1.3] text-ink shadow-[0.6cqw_0.6cqw_0_var(--color-ink)]',
                "after:absolute after:bottom-[-1.7cqw] after:size-[3cqw] after:rotate-45 after:border-b-2 after:border-r-2 after:border-ink after:bg-white after:content-['']",
                TAIL_CLASS[panel.tail],
              )}
              style={panel.box}
            >
              {panel.bubble}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
