import {
  PASSWORD_CHECKS,
  type PasswordCheck,
} from '@/features/auth/schemas/password-rules';
import { cn } from '@/lib/cn';

interface ChecklistItem {
  label: string;
  checks: PasswordCheck[];
}

/** One line per requirement, in rule order; a line is met when all its checks pass. */
const CHECKLIST: readonly ChecklistItem[] = PASSWORD_CHECKS.reduce<
  ChecklistItem[]
>((items, check) => {
  const item = items.find(({ label }) => label === check.requirement);
  if (item) {
    item.checks.push(check);
  } else {
    items.push({ label: check.requirement, checks: [check] });
  }
  return items;
}, []);

interface PasswordChecklistProps {
  password: string;
}

/** Live view of the password rules; each one turns green once satisfied. */
export function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <ul aria-label="Password requirements" className="grid gap-1 pt-1 text-sm">
      {CHECKLIST.map(({ label, checks }) => {
        const met = checks.every((check) => check.passes(password));
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
