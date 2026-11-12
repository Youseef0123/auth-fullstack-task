import type { Metadata } from 'next';
import { SignUpForm } from '@/features/auth/components/sign-up-form';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It only takes a minute. Your session stays in a secure cookie.
        </p>
      </header>
      <SignUpForm />
    </>
  );
}
