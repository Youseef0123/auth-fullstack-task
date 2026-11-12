import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { THEME_STORAGE_KEY } from '@/lib/theme';

/** jsdom has no matchMedia; this one lets a test flip the system theme. */
function mockSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: dark,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    set(nextDark: boolean) {
      media.matches = nextDark;
      listeners.forEach((listener) => listener());
    },
  };
}

const theme = () => document.documentElement.dataset.theme;

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('switches the theme and remembers the choice', async () => {
    mockSystemTheme(false);
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Dark theme' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));

    await user.click(button);
    expect(theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    await waitFor(() =>
      expect(button).toHaveAttribute('aria-pressed', 'false'),
    );
  });

  it('follows the system theme while nothing is stored', () => {
    const system = mockSystemTheme(false);
    render(<ThemeToggle />);

    system.set(true);
    expect(theme()).toBe('dark');
    system.set(false);
    expect(theme()).toBe('light');
  });

  it('catches a system change that happened before it mounted', () => {
    mockSystemTheme(true);
    render(<ThemeToggle />);
    expect(theme()).toBe('dark');
  });

  it('keeps a stored choice when the system theme changes', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const system = mockSystemTheme(false);
    render(<ThemeToggle />);

    system.set(true);
    expect(theme()).toBe('light');
  });
});
