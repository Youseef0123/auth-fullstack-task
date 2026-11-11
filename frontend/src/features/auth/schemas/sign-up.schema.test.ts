import { describe, expect, it } from 'vitest';
import { signUpSchema } from '@/features/auth/schemas/sign-up.schema';
import {
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '@/features/auth/schemas/validation.constants';

const VALID = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Str0ng!pass',
};

function messagesFor(field: keyof typeof VALID, value: string): string[] {
  const result = signUpSchema.safeParse({ ...VALID, [field]: value });
  return result.success
    ? []
    : result.error.issues
        .filter((issue) => issue.path[0] === field)
        .map((issue) => issue.message);
}

describe('signUpSchema', () => {
  it('accepts a valid sign-up', () => {
    expect(signUpSchema.safeParse(VALID).success).toBe(true);
  });

  describe('password: reports only the first broken rule', () => {
    it.each([
      ['empty', '', PASSWORD_MESSAGES.required],
      ['too short (only rule broken)', 'Ab1!', PASSWORD_MESSAGES.minLength],
      [
        'too short and missing number/special',
        'abc',
        PASSWORD_MESSAGES.minLength,
      ],
      ['too long', `A1!${'a'.repeat(126)}`, PASSWORD_MESSAGES.maxLength],
      ['no letter', '12345678!', PASSWORD_MESSAGES.letter],
      ['no number', 'Password!', PASSWORD_MESSAGES.number],
      ['no number and no special', 'Password', PASSWORD_MESSAGES.number],
      ['no special character', 'Passw0rd', PASSWORD_MESSAGES.specialCharacter],
      ['line break', 'Passw0rd!\n', PASSWORD_MESSAGES.invalid],
    ])('%s -> one message', (_case, password, message) => {
      expect(messagesFor('password', password)).toEqual([message]);
    });

    it('accepts the length boundaries 8 and 128', () => {
      expect(messagesFor('password', 'Abcd12!x')).toEqual([]);
      expect(messagesFor('password', `A1!${'a'.repeat(125)}`)).toEqual([]);
    });

    it('does not trim the password', () => {
      const result = signUpSchema.parse({ ...VALID, password: ' Passw0rd ' });
      expect(result.password).toBe(' Passw0rd ');
    });
  });

  describe('name', () => {
    it.each([
      ['too short', 'ab'],
      ['too short once trimmed', '   ab   '],
      ['blank', '    '],
      ['too long', 'x'.repeat(51)],
    ])('rejects %s', (_case, name) => {
      expect(messagesFor('name', name)).toEqual([NAME_MESSAGES.length]);
    });

    it('accepts 3 and 50 characters', () => {
      expect(messagesFor('name', 'Joe')).toEqual([]);
      expect(messagesFor('name', 'x'.repeat(50))).toEqual([]);
    });

    it('trims the name', () => {
      expect(signUpSchema.parse({ ...VALID, name: '  Jane Doe  ' }).name).toBe(
        'Jane Doe',
      );
    });
  });
});
