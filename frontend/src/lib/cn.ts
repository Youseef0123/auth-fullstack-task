/** Joins class names, skipping falsy values. Callers must not pass conflicting utilities. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
