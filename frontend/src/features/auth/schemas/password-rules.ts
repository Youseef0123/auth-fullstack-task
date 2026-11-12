import {
  PASSWORD_MESSAGES,
  PASSWORD_RULES,
} from '@/features/auth/schemas/validation.constants';

export interface PasswordCheck {
  passes: (password: string) => boolean;
  /** Error shown when this is the first broken rule. */
  message: string;
  /** Checklist line; checks that share one (min and max length) form one line. */
  requirement: string;
}

const LENGTH_REQUIREMENT = `${PASSWORD_RULES.minLength}–${PASSWORD_RULES.maxLength} characters`;

/**
 * Same rules, order and messages as the backend's @IsPassword() decorator.
 * Drives both the schema error and the live PasswordChecklist.
 */
export const PASSWORD_CHECKS: readonly PasswordCheck[] = [
  {
    passes: (p) => p.length >= PASSWORD_RULES.minLength,
    message: PASSWORD_MESSAGES.minLength,
    requirement: LENGTH_REQUIREMENT,
  },
  {
    passes: (p) => p.length <= PASSWORD_RULES.maxLength,
    message: PASSWORD_MESSAGES.maxLength,
    requirement: LENGTH_REQUIREMENT,
  },
  {
    passes: (p) => PASSWORD_RULES.letterPattern.test(p),
    message: PASSWORD_MESSAGES.letter,
    requirement: 'One letter',
  },
  {
    passes: (p) => PASSWORD_RULES.numberPattern.test(p),
    message: PASSWORD_MESSAGES.number,
    requirement: 'One number',
  },
  {
    passes: (p) => PASSWORD_RULES.specialCharacterPattern.test(p),
    message: PASSWORD_MESSAGES.specialCharacter,
    requirement: 'One special character',
  },
];

/** Returns only the first broken rule, like the backend, or undefined when valid. */
export function getPasswordError(password: string): string | undefined {
  if (password.length === 0) {
    return PASSWORD_MESSAGES.required;
  }
  if (PASSWORD_RULES.pattern.test(password)) {
    return undefined;
  }
  const failedCheck = PASSWORD_CHECKS.find((check) => !check.passes(password));
  return failedCheck ? failedCheck.message : PASSWORD_MESSAGES.invalid;
}
