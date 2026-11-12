/** Decorative 18px icons for Input's startIcon (elements, not components). */
const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-[18px]',
} as const;

export const MAIL_ICON = (
  <svg {...ICON_PROPS}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const LOCK_ICON = (
  <svg {...ICON_PROPS}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const USER_ICON = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const ARROW_RIGHT_ICON = (
  <svg
    {...ICON_PROPS}
    className="size-4 transition-transform group-hover:translate-x-0.5"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
