import type { Metadata } from 'next';
import { SignInForm } from '@/features/auth/components/sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to continue to your account.
        </p>
      </header>
      <SignInForm />
    </>
  );
}
