import { describe, expect, it } from 'vitest';
import { signInSchema } from '@/features/auth/schemas/sign-in.schema';
import { PASSWORD_MESSAGES } from '@/features/auth/schemas/validation.constants';

describe('signInSchema', () => {
  it('normalizes the email like sign-up', () => {
    expect(
      signInSchema.parse({ email: ' JANE@example.com ', password: 'x' }),
    ).toEqual({ email: 'jane@example.com', password: 'x' });
  });

  it.each(['x', 'weak', 'abcdefgh'])(
    'only requires a non-empty password (%p passes)',
    (password) => {
      expect(
        signInSchema.safeParse({ email: 'jane@example.com', password }).success,
      ).toBe(true);
    },
  );

  it('rejects an empty password with the backend message', () => {
    const result = signInSchema.safeParse({
      email: 'jane@example.com',
      password: '',
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      PASSWORD_MESSAGES.required,
    ]);
  });
});
