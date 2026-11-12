'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import {
  applyTheme,
  currentTheme,
  storedTheme,
  storeTheme,
  systemTheme,
  watchSystemTheme,
} from '@/lib/theme';

function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const TONES = {
  surface: 'border-border bg-card text-muted-foreground hover:text-foreground',
  onDark: 'border-white/20 bg-white/10 text-white/80 hover:text-white',
} as const;

interface ThemeToggleProps {
  /** onDark for the always-dark hero panels. */
  tone?: keyof typeof TONES;
}

/**
 * Light/dark switch. The icon is chosen by CSS (dark: variant), so the server
 * HTML is correct before hydration; the choice is a display preference only.
 */
export function ThemeToggle({ tone = 'surface' }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    currentTheme,
    () => null,
  );

  // Until the user picks a theme, keep following the system setting. The
  // first call catches a change between the <head> script and hydration.
  useEffect(() => {
    function followSystem() {
      if (storedTheme() === null) {
        applyTheme(systemTheme());
      }
    }
    followSystem();
    return watchSystemTheme(followSystem);
  }, []);

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Dark theme"
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      className={cn(
        'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border shadow-xs transition-colors',
        TONES[tone],
      )}
    >
      <svg {...ICON_PROPS} className="size-[18px] dark:hidden">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
      <svg {...ICON_PROPS} className="hidden size-[18px] dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
