import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <>
      <Card>
        <header className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your account.
          </p>
        </header>
        <SignInForm />
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={ROUTES.signUp}
          className="rounded-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
