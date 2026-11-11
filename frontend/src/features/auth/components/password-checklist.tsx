import { PASSWORD_RULES } from '@/features/auth/schemas/validation.constants';
import { cn } from '@/lib/cn';

interface ChecklistItem {
  label: string;
  passes: (password: string) => boolean;
}

const CHECKLIST: readonly ChecklistItem[] = [
  {
    label: `${PASSWORD_RULES.minLength}–${PASSWORD_RULES.maxLength} characters`,
    passes: (p) =>
      p.length >= PASSWORD_RULES.minLength &&
      p.length <= PASSWORD_RULES.maxLength,
  },
  {
    label: 'One letter',
    passes: (p) => PASSWORD_RULES.letterPattern.test(p),
  },
  {
    label: 'One number',
    passes: (p) => PASSWORD_RULES.numberPattern.test(p),
  },
  {
    label: 'One special character',
    passes: (p) => PASSWORD_RULES.specialCharacterPattern.test(p),
  },
];

interface PasswordChecklistProps {
  password: string;
}

/** Live view of the password rules; each one turns green once satisfied. */
export function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <ul aria-label="Password requirements" className="grid gap-1 pt-1 text-sm">
      {CHECKLIST.map(({ label, passes }) => {
        const met = passes(password);
        return (
          <li
            key={label}
            className={cn(
              'flex items-center gap-2 transition-colors',
              met ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 shrink-0"
            >
              {met ? (
                <path d="M3.5 8.5l3 3 6-7" />
              ) : (
                <circle cx="8" cy="8" r="5.5" strokeWidth="1.5" />
              )}
            </svg>
            {label}
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
