export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Inlined in <head> so the theme is set before the first paint (no flash):
 * the stored choice if there is one, otherwise the system preference.
 */
export const THEME_INIT_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('${DARK_QUERY}').matches?'dark':'light'}document.documentElement.dataset.theme=t})()`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function systemTheme(): Theme {
  return matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** The theme the user picked with the toggle, or null to follow the system. */
export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
}

export function watchSystemTheme(onChange: () => void): () => void {
  const media = matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
