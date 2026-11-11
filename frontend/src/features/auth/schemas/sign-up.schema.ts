import { z } from 'zod';
import { emailSchema } from '@/features/auth/schemas/email.schema';
import { getPasswordError } from '@/features/auth/schemas/password-rules';
import {
  NAME_MESSAGES,
  NAME_RULES,
} from '@/features/auth/schemas/validation.constants';

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_RULES.minLength, NAME_MESSAGES.length)
    .max(NAME_RULES.maxLength, NAME_MESSAGES.length),
  email: emailSchema,
  password: z.string().superRefine((password, ctx) => {
    const message = getPasswordError(password);
    if (message) {
      ctx.addIssue({ code: 'custom', message });
    }
  }),
});

export type SignUpFormValues = z.input<typeof signUpSchema>;
