'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  ARROW_RIGHT_ICON,
  LOCK_ICON,
  MAIL_ICON,
} from '@/components/ui/input-icons';
import { PasswordInput } from '@/features/auth/components/password-input';
import { authFieldForMessage } from '@/features/auth/schemas/field-messages';
import {
  signInSchema,
  type SignInFormValues,
} from '@/features/auth/schemas/sign-in.schema';
import { selectSignIn, useAuthStore } from '@/features/auth/store/auth.store';
import type { SignInRequest } from '@/features/auth/types/auth.types';
import { applyApiError } from '@/lib/form-errors';
import { ROUTES } from '@/lib/routes';

export function SignInForm() {
  const router = useRouter();
  const signIn = useAuthStore(selectSignIn);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SignInFormValues, unknown, SignInRequest>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values);
      router.replace(ROUTES.home);
    } catch (error) {
      applyApiError(error, setError, {
        fields: ['email', 'password'],
        fieldForMessage: authFieldForMessage,
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <Alert>{errors.root.server.message}</Alert>
      )}
      <FormField id="signin-email" label="Email" error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('email')}
            type="email"
            autoComplete="email"
            startIcon={MAIL_ICON}
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
          />
        )}
      </FormField>
      <FormField
        id="signin-password"
        label="Password"
        error={errors.password?.message}
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...register('password')}
            autoComplete="current-password"
            startIcon={LOCK_ICON}
          />
        )}
      </FormField>
      {/* Stays busy after success until the navigation to /app completes. */}
      <Button
        type="submit"
        loading={isSubmitting || isSubmitSuccessful}
        className="mt-1 w-full"
      >
        Sign in
        {ARROW_RIGHT_ICON}
      </Button>
    </form>
  );
}
