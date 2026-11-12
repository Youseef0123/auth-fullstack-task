import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestGuard } from '@/app/(auth)/_components/guest-guard';
import { useAuthStore } from '@/features/auth/store/auth.store';

// useRouter() returns a stable instance in Next.js; the mock must too.
const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));

function renderGuard() {
  return render(
    <GuestGuard>
      <p>Sign-in form</p>
    </GuestGuard>,
  );
}

describe('GuestGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('sends a signed-in user back to /app instead of showing the form', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'jane@example.com', name: 'Jane Doe' },
      status: 'authenticated',
    });

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/app');
    expect(screen.getByRole('status')).toHaveTextContent('Redirecting…');
    expect(screen.queryByText('Sign-in form')).not.toBeInTheDocument();
  });

  it.each(['idle', 'unauthenticated'] as const)(
    'shows the page when the status is %s',
    (status) => {
      useAuthStore.setState({ user: null, status });

      renderGuard();

      expect(screen.getByText('Sign-in form')).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    },
  );
});
