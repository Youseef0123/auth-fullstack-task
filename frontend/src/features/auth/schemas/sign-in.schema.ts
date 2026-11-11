import { z } from 'zod';
import { emailSchema } from '@/features/auth/schemas/email.schema';
import { PASSWORD_MESSAGES } from '@/features/auth/schemas/validation.constants';

/** Sign-in only requires a password; strength rules apply at sign-up (same as the backend). */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, PASSWORD_MESSAGES.required),
});

export type SignInFormValues = z.input<typeof signInSchema>;
