import { describe, expect, it, vi } from 'vitest';
import type { UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api-error';
import { applyApiError } from '@/lib/form-errors';

interface Values {
  email: string;
  password: string;
}

const FIELDS: readonly (keyof Values)[] = ['email', 'password'];
const FIELD_BY_MESSAGE: Readonly<Record<string, string>> = {
  'Bad email': 'email',
  'Bad password': 'password',
  'Name too short': 'name',
};
const fieldForMessage = (message: string): string | undefined =>
  FIELD_BY_MESSAGE[message];

function apply(
  error: unknown,
  fieldByStatus: Partial<Record<number, keyof Values>> = {},
) {
  const setError = vi.fn<UseFormSetError<Values>>();
  applyApiError<Values>(error, setError, {
    fields: FIELDS,
    fieldForMessage,
    fieldByStatus,
  });
  return setError.mock.calls;
}

describe('applyApiError', () => {
  it('puts the first message per field on that field and focuses the first', () => {
    const calls = apply(
      new ApiError(400, 'Bad email', [
        'Bad email',
        'Bad password',
        'Bad email',
      ]),
    );

    expect(calls).toEqual([
      [
        'email',
        { type: 'server', message: 'Bad email' },
        { shouldFocus: true },
      ],
      [
        'password',
        { type: 'server', message: 'Bad password' },
        { shouldFocus: false },
      ],
    ]);
  });

  it('ignores messages for fields the form does not have', () => {
    const calls = apply(
      new ApiError(400, 'Name too short', ['Name too short']),
    );

    expect(calls).toEqual([
      ['root.server', { type: 'server', message: 'Name too short' }],
    ]);
  });

  it('routes a whole status to one field', () => {
    const calls = apply(new ApiError(409, 'Taken', ['Taken']), {
      409: 'email',
    });

    expect(calls).toEqual([
      ['email', { type: 'server', message: 'Taken' }, { shouldFocus: true }],
    ]);
  });

  it('falls back to the user-facing message at form level', () => {
    const calls = apply(
      new ApiError(429, 'Too many attempts', ['Too many requests (raw)']),
    );

    expect(calls).toEqual([
      ['root.server', { type: 'server', message: 'Too many attempts' }],
    ]);
  });

  it('treats unknown errors as unexpected', () => {
    const calls = apply(new Error('boom'));

    expect(calls).toEqual([
      [
        'root.server',
        { type: 'server', message: 'Something went wrong. Please try again.' },
      ],
    ]);
  });
});
