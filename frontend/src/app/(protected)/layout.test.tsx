import { render, screen, waitFor } from '@testing-library/react';
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
import ProtectedLayout from '@/app/(protected)/layout';
import { useAuthStore } from '@/features/auth/store/auth.store';

// useRouter() returns a stable instance in Next.js; the mock must too.
const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const server = setupServer();
const requests: string[] = [];
server.events.on('request:start', ({ request }) => {
  requests.push(`${request.method} ${new URL(request.url).pathname}`);
});
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SESSION_USER = {
  id: '6650c0f2a1b2c3d4e5f60718',
  email: 'jane@example.com',
  name: 'Jane Doe',
};

function renderLayout() {
  return render(
    <ProtectedLayout>
      <p>Protected content</p>
    </ProtectedLayout>,
  );
}

describe('(protected) layout', () => {
  beforeEach(() => {
    requests.length = 0;
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('on 401 from /users/me clears the cookie and redirects to /signin', async () => {
    server.use(
      mock.get('*/api/users/me', () =>
        HttpResponse.json(
          {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized',
            path: '/api/users/me',
            timestamp: new Date().toISOString(),
          },
          { status: 401 },
        ),
      ),
      mock.post(
        '*/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    renderLayout();

    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/signin'));
    expect(requests).toEqual(['GET /api/users/me', 'POST /api/auth/logout']);
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('does not fetch when the store already holds the user', () => {
    useAuthStore.setState({ user: SESSION_USER, status: 'authenticated' });

    renderLayout();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(requests).toEqual([]);
    expect(replace).not.toHaveBeenCalled();
  });

  it('renders the page once /users/me confirms the session', async () => {
    server.use(
      mock.get('*/api/users/me', () =>
        HttpResponse.json({
          ...SESSION_USER,
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      ),
    );

    renderLayout();

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toEqual(SESSION_USER);
  });

  it('offers a retry instead of redirecting when the server is unreachable', async () => {
    server.use(mock.get('*/api/users/me', () => HttpResponse.error()));
    const user = userEvent.setup();

    renderLayout();

    expect(
      await screen.findByText("We couldn't load your account"),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();

    server.use(
      mock.get('*/api/users/me', () => HttpResponse.json(SESSION_USER)),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
  });
});
