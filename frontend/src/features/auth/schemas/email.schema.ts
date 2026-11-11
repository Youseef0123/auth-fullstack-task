import { z } from 'zod';
import { EMAIL_MESSAGES } from '@/features/auth/schemas/validation.constants';

/** Trimmed and lowercased before validation, as the backend's @NormalizeEmail() does. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email(EMAIL_MESSAGES.invalid));
