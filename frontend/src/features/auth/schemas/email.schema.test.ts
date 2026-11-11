import { describe, expect, it } from 'vitest';
import { emailSchema } from '@/features/auth/schemas/email.schema';
import { EMAIL_MESSAGES } from '@/features/auth/schemas/validation.constants';

describe('emailSchema', () => {
  it('trims and lowercases before validating', () => {
    expect(emailSchema.parse('  Jane.Doe@Example.COM ')).toBe(
      'jane.doe@example.com',
    );
  });

  it.each([
    'jane@example.com',
    'a.b+tag@sub.example.co',
    "o'brien@example.org",
  ])('accepts %s', (email) => {
    expect(emailSchema.safeParse(email).success).toBe(true);
  });

  it.each(['', '   ', 'jane', 'jane@', 'jane@example', 'a..b@example.com'])(
    'rejects %p with the backend message',
    (email) => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.message)).toEqual([
        EMAIL_MESSAGES.invalid,
      ]);
    },
  );
});
