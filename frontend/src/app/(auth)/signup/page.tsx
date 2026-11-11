import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Create account' };

export default function SignUpPage() {
  return (
    <>
      <Card>
        <header className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            It only takes a minute.
          </p>
        </header>
        <SignUpForm />
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={ROUTES.signIn}
          className="rounded-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
