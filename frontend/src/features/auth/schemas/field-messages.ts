import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '@/features/auth/schemas/validation.constants';

/**
 * Backend 400 responses carry an array of messages without field names; these
 * are the messages each field can produce, used to route them back to inputs.
 */
export const FIELD_MESSAGES: Readonly<Record<string, readonly string[]>> = {
  email: Object.values(EMAIL_MESSAGES),
  name: Object.values(NAME_MESSAGES),
  password: Object.values(PASSWORD_MESSAGES),
};
