import { describe, expect, it } from 'vitest';
import { authFieldForMessage } from '@/features/auth/schemas/field-messages';
import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '@/features/auth/schemas/validation.constants';

describe('authFieldForMessage', () => {
  it.each([
    ...Object.values(EMAIL_MESSAGES).map((message) => [message, 'email']),
    ...Object.values(NAME_MESSAGES).map((message) => [message, 'name']),
    ...Object.values(PASSWORD_MESSAGES).map((message) => [message, 'password']),
  ])('routes %p to %s', (message, field) => {
    expect(authFieldForMessage(message)).toBe(field);
  });

  it.each([
    'property role should not exist',
    'Invalid email or password',
    'Email already registered',
  ])('leaves %p without a field', (message) => {
    expect(authFieldForMessage(message)).toBeUndefined();
  });
});
