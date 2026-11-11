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
import { LogoutButton } from '@/features/auth/components/logout-button';
import { useAuthStore } from '@/features/auth/store/auth.store';

// useRouter() returns a stable instance in Next.js; the mock must too.
const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('LogoutButton', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'jane@example.com', name: 'Jane Doe' },
      status: 'authenticated',
    });
  });

  it('logs out, clears the store and replaces the route with /signin', async () => {
    server.use(
      mock.post(
        '*/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(replace).toHaveBeenCalledWith('/signin');
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      status: 'unauthenticated',
    });
  });

  it('stays signed in and explains when the server cannot be reached', async () => {
    server.use(mock.post('*/api/auth/logout', () => HttpResponse.error()));
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't sign out. Please try again.",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });
});
