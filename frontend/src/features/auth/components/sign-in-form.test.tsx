import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http as mock } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { useAuthStore } from '@/features/auth/store/auth.store';

// useRouter() returns a stable instance in Next.js; the mock must too.
const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function respondToSignIn(status: number, message: string) {
  server.use(
    mock.post('*/api/auth/signin', () =>
      HttpResponse.json(
        {
          statusCode: status,
          message,
          error: 'Error',
          path: '/api/auth/signin',
          timestamp: new Date().toISOString(),
        },
        { status },
      ),
    ),
  );
}

async function submitCredentials() {
  const user = userEvent.setup();
  render(<SignInForm />);
  await user.type(screen.getByLabelText('Email'), 'jane@example.com');
  await user.type(screen.getByLabelText('Password'), 'Wr0ng!pass');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('SignInForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('shows a 401 as a form-level alert, not on a field', async () => {
    respondToSignIn(401, 'Invalid email or password');

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    );
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Password')).not.toHaveAttribute(
      'aria-invalid',
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows the rate-limit message on 429', async () => {
    respondToSignIn(429, 'Too many requests, please try again later');

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts, please try again later',
    );
  });

  it('signs in and redirects to /app', async () => {
    server.use(
      mock.post('*/api/auth/signin', () =>
        HttpResponse.json({
          id: '6650c0f2a1b2c3d4e5f60718',
          email: 'jane@example.com',
          name: 'Jane Doe',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
    );

    await submitCredentials();

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/app'));
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
