import { ValidateBy, ValidationArguments } from 'class-validator';
import {
  PASSWORD_MESSAGES,
  PASSWORD_RULES,
} from '../constants/validation.constants';

type PasswordCheck = readonly [
  passes: (password: string) => boolean,
  message: string,
];

const PASSWORD_CHECKS: readonly PasswordCheck[] = [
  [(p) => p.length >= PASSWORD_RULES.minLength, PASSWORD_MESSAGES.minLength],
  [(p) => p.length <= PASSWORD_RULES.maxLength, PASSWORD_MESSAGES.maxLength],
  [(p) => PASSWORD_RULES.letterPattern.test(p), PASSWORD_MESSAGES.letter],
  [(p) => PASSWORD_RULES.numberPattern.test(p), PASSWORD_MESSAGES.number],
  [
    (p) => PASSWORD_RULES.specialCharacterPattern.test(p),
    PASSWORD_MESSAGES.specialCharacter,
  ],
];

function describePasswordError(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    return PASSWORD_MESSAGES.required;
  }
  const failedCheck = PASSWORD_CHECKS.find(([passes]) => !passes(value));
  return failedCheck ? failedCheck[1] : PASSWORD_MESSAGES.invalid;
}

/**
 * Validates against the canonical password regex and reports the first
 * broken rule, so clients get a single, specific message.
 */
export function IsPassword(): PropertyDecorator {
  return ValidateBy({
    name: 'isPassword',
    validator: {
      validate: (value: unknown): boolean =>
        typeof value === 'string' && PASSWORD_RULES.pattern.test(value),
      defaultMessage: (args?: ValidationArguments): string =>
        describePasswordError(args?.value),
    },
  });
}
