import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  storedTheme,
  storeTheme,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
} from '@/lib/theme';

function mockSystemTheme(dark: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: dark }));
}

/** Runs the inline <head> script the way the browser does, as plain source. */
function runInitScript() {
  new Function(THEME_INIT_SCRIPT)();
}

const theme = () => document.documentElement.dataset.theme;

describe('THEME_INIT_SCRIPT', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('applies the stored choice over the system theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    mockSystemTheme(false);
    runInitScript();
    expect(theme()).toBe('dark');
  });

  it('falls back to the system theme without a valid stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    mockSystemTheme(true);
    runInitScript();
    expect(theme()).toBe('dark');
  });

  it('falls back to the system theme when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mockSystemTheme(false);
    runInitScript();
    expect(theme()).toBe('light');
  });
});

describe('theme storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('round-trips a valid choice and ignores anything else', () => {
    expect(storedTheme()).toBeNull();
    storeTheme('dark');
    expect(storedTheme()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(storedTheme()).toBeNull();
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => storeTheme('dark')).not.toThrow();
    expect(storedTheme()).toBeNull();
  });
});
