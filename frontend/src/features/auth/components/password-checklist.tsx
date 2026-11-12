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

/**
 * Label and bar colour by number of requirements met (1-4). Any typed character
 * is a letter, digit or special character, so a non-empty password meets at least one.
 */
const STRENGTH_LEVELS = [
  { label: 'Weak', bar: 'bg-danger', text: 'text-danger' },
  {
    label: 'Fair',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Good',
    bar: 'bg-lime-500',
    text: 'text-lime-700 dark:text-lime-400',
  },
  { label: 'Strong', bar: 'bg-success', text: 'text-success' },
] as const;

interface PasswordChecklistProps {
  password: string;
}

/**
 * Live view of the password rules: a strength meter (with a text label, not
 * colour alone) and one line per rule that turns green once satisfied.
 */
export function PasswordChecklist({ password }: PasswordChecklistProps) {
  const metByRequirement = CHECKLIST.map(({ checks }) =>
    checks.every((check) => check.passes(password)),
  );
  const metCount = metByRequirement.filter(Boolean).length;
  const level = STRENGTH_LEVELS[Math.max(metCount, 1) - 1];

  return (
    <div className="grid gap-2.5 pt-1">
      {password.length > 0 && (
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1.5">
            {CHECKLIST.map(({ label }, index) => (
              <span
                key={label}
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-300',
                  index < metCount ? level.bar : 'bg-muted',
                )}
              />
            ))}
          </div>
          <p
            className={cn('w-16 text-right text-xs font-semibold', level.text)}
          >
            <span className="sr-only">Password strength: </span>
            {level.label}
          </p>
        </div>
      )}
      <ul aria-label="Password requirements" className="grid gap-1 text-sm">
        {CHECKLIST.map(({ label }, index) => {
          const met = metByRequirement[index];
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
    </div>
  );
}
