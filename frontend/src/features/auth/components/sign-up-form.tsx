'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordChecklist } from '@/features/auth/components/password-checklist';
import { PasswordInput } from '@/features/auth/components/password-input';
import { authFieldForMessage } from '@/features/auth/schemas/field-messages';
import {
  signUpSchema,
  type SignUpFormValues,
} from '@/features/auth/schemas/sign-up.schema';
import { selectSignUp, useAuthStore } from '@/features/auth/store/auth.store';
import type { SignUpRequest } from '@/features/auth/types/auth.types';
import { applyApiError } from '@/lib/form-errors';
import { ROUTES } from '@/lib/routes';

export function SignUpForm() {
  const router = useRouter();
  const signUp = useAuthStore(selectSignUp);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SignUpFormValues, unknown, SignUpRequest>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      router.replace(ROUTES.home);
    } catch (error) {
      applyApiError(error, setError, {
        fields: ['name', 'email', 'password'],
        fieldForMessage: authFieldForMessage,
        fieldByStatus: { 409: 'email' },
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {errors.root?.server?.message && (
        <Alert>{errors.root.server.message}</Alert>
      )}
      <FormField id="signup-name" label="Name" error={errors.name?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('name')}
            autoComplete="name"
            placeholder="Jane Doe"
          />
        )}
      </FormField>
      <FormField id="signup-email" label="Email" error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
          />
        )}
      </FormField>
      <FormField
        id="signup-password"
        label="Password"
        error={errors.password?.message}
        hint={<PasswordChecklist password={password} />}
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...register('password')}
            autoComplete="new-password"
          />
        )}
      </FormField>
      {/* Stays busy after success until the navigation to /app completes. */}
      <Button
        type="submit"
        loading={isSubmitting || isSubmitSuccessful}
        className="mt-1 w-full"
      >
        Create account
      </Button>
    </form>
  );
}
