import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '@/features/auth/schemas/validation.constants';

export type AuthField = 'email' | 'name' | 'password';

/**
 * Backend 400 responses carry an array of messages without field names; these
 * are the messages each auth field can produce (shared, drift-guarded constants).
 */
const FIELD_MESSAGES: readonly (readonly [AuthField, readonly string[]])[] = [
  ['email', Object.values(EMAIL_MESSAGES)],
  ['name', Object.values(NAME_MESSAGES)],
  ['password', Object.values(PASSWORD_MESSAGES)],
];

const FIELD_BY_MESSAGE = new Map(
  FIELD_MESSAGES.flatMap(([field, messages]) =>
    messages.map((message) => [message, field] as const),
  ),
);

/** The auth form field a backend validation message belongs to, if any. */
export function authFieldForMessage(message: string): AuthField | undefined {
  return FIELD_BY_MESSAGE.get(message);
}
