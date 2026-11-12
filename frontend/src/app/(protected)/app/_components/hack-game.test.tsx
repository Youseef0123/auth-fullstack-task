import { render, screen, within } from '@testing-library/react';
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
} from 'vitest';
import { HackGame } from '@/app/(protected)/app/_components/hack-game';
import { useAuthStore } from '@/features/auth/store/auth.store';

const LIMIT = 3;
let signInCalls = 0;
const forwardedFor: (string | null)[] = [];

function backendError(statusCode: number, message: string | string[]) {
  return HttpResponse.json(
    { statusCode, message, error: 'Error', path: '/api', timestamp: '' },
    { status: statusCode },
  );
}

const server = setupServer(
  mock.post('*/api/auth/signin', ({ request }) => {
    signInCalls += 1;
    forwardedFor.push(request.headers.get('x-forwarded-for'));
    return signInCalls > LIMIT
      ? backendError(429, 'Too many requests, please try again later')
      : backendError(401, 'Invalid email or password');
  }),
  mock.post('*/api/auth/signup', () =>
    backendError(400, ['property role should not exist']),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function launch(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(
    screen.getByRole('button', { name: `Launch attack: ${title}` }),
  );
}

describe('HackGame', () => {
  beforeEach(() => {
    signInCalls = 0;
    forwardedFor.length = 0;
    useAuthStore.setState({
      user: { id: '1', email: 'jane@example.com', name: 'Jane Doe' },
      status: 'authenticated',
    });
  });

  it('blocks every attack and hands out a certificate of attempted hacking', async () => {
    const user = userEvent.setup();
    render(<HackGame />);
    const log = screen.getByRole('log');

    await launch(user, 'Steal the session cookie');
    expect(
      await within(log).findByText(
        'Blocked: the session cookie is httpOnly, so JavaScript never sees it.',
      ),
    ).toBeInTheDocument();

    await launch(user, 'Brute-force a password');
    expect(
      await within(log).findByText(
        `Blocked after ${LIMIT} wrong guesses: 429 Too Many Requests.`,
      ),
    ).toBeInTheDocument();

    await launch(user, 'Pretend to be someone else');
    expect(
      await within(log).findByText(
        "Blocked: a header you set yourself doesn't change who you are.",
      ),
    ).toBeInTheDocument();
    expect(forwardedFor.at(-1)).toMatch(/^203\.0\.113\.\d+$/);

    await launch(user, 'Sign up as an admin');
    expect(
      await within(log).findByText(/400 property role should not exist/),
    ).toBeInTheDocument();

    await launch(user, 'Steal the password database');
    expect(
      await within(log).findByText(
        'Blocked: passwords are argon2id hashes, slow to crack by design.',
      ),
    ).toBeInTheDocument();

    const certificate = await screen.findByRole('status');
    expect(certificate).toHaveTextContent('Certificate of attempted hacking');
    expect(certificate).toHaveTextContent('Jane Doe');
    expect(certificate).toHaveTextContent('Defences held: 5/5');
    expect(screen.getByText('Gave up')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Unstoppable')).toBeInTheDocument();
  });

  it('lets you retry an attack that could not reach the server', async () => {
    server.use(mock.post('*/api/auth/signin', () => HttpResponse.error()));
    const user = userEvent.setup();
    render(<HackGame />);

    await launch(user, 'Brute-force a password');

    expect(
      await within(screen.getByRole('log')).findByText(
        /never reached the server/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Launch attack: Brute-force a password',
      }),
    ).toHaveTextContent('Retry');
    expect(screen.getByText('Unstoppable')).toBeInTheDocument();
  });
});
