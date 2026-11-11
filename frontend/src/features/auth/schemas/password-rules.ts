import {
  PASSWORD_MESSAGES,
  PASSWORD_RULES,
} from '@/features/auth/schemas/validation.constants';

interface PasswordCheck {
  passes: (password: string) => boolean;
  message: string;
}

/** Same rules, order and messages as the backend's @IsPassword() decorator. */
const PASSWORD_CHECKS: readonly PasswordCheck[] = [
  {
    passes: (p) => p.length >= PASSWORD_RULES.minLength,
    message: PASSWORD_MESSAGES.minLength,
  },
  {
    passes: (p) => p.length <= PASSWORD_RULES.maxLength,
    message: PASSWORD_MESSAGES.maxLength,
  },
  {
    passes: (p) => PASSWORD_RULES.letterPattern.test(p),
    message: PASSWORD_MESSAGES.letter,
  },
  {
    passes: (p) => PASSWORD_RULES.numberPattern.test(p),
    message: PASSWORD_MESSAGES.number,
  },
  {
    passes: (p) => PASSWORD_RULES.specialCharacterPattern.test(p),
    message: PASSWORD_MESSAGES.specialCharacter,
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
