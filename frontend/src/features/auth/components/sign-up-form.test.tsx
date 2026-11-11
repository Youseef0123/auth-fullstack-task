import { render, screen, waitFor, within } from '@testing-library/react';
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
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { useAuthStore } from '@/features/auth/store/auth.store';

// useRouter() returns a stable instance in Next.js; the mock must too.
const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
const { replace } = router;
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const CREATED_USER = {
  id: '6650c0f2a1b2c3d4e5f60718',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderForm() {
  const user = userEvent.setup();
  render(<SignUpForm />);
  return {
    user,
    name: screen.getByLabelText('Name'),
    email: screen.getByLabelText('Email'),
    password: screen.getByLabelText('Password'),
    submit: screen.getByRole('button', { name: 'Create account' }),
  };
}

async function fillValidForm(form: ReturnType<typeof renderForm>) {
  await form.user.type(form.name, '  Jane Doe ');
  await form.user.type(form.email, ' Jane@Example.com ');
  await form.user.type(form.password, 'Str0ng!pass');
}

describe('SignUpForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('shows field errors only once a field is left (onTouched)', async () => {
    const form = renderForm();

    await form.user.type(form.name, 'Jo');
    expect(
      screen.queryByText('Name must be between 3 and 50 characters'),
    ).not.toBeInTheDocument();

    await form.user.tab();
    expect(form.name).toHaveAccessibleDescription(
      'Name must be between 3 and 50 characters',
    );
    expect(form.name).toHaveAttribute('aria-invalid', 'true');

    await form.user.type(form.email, 'jane@');
    await form.user.tab();
    expect(form.email).toHaveAccessibleDescription(
      'Please enter a valid email address',
    );
  });

  it('updates the password checklist on every keystroke', async () => {
    const form = renderForm();
    const checklist = screen.getByRole('list', {
      name: 'Password requirements',
    });
    const metRules = () =>
      within(checklist)
        .getAllByRole('listitem')
        .filter((item) => item.textContent?.endsWith('(met)'))
        .map((item) => item.textContent?.replace('(met)', ''));

    expect(metRules()).toEqual([]);

    await form.user.type(form.password, 'abc');
    expect(metRules()).toEqual(['One letter']);

    await form.user.type(form.password, '1');
    expect(metRules()).toEqual(['One letter', 'One number']);

    await form.user.type(form.password, '!xyz');
    expect(metRules()).toEqual([
      '8–128 characters',
      'One letter',
      'One number',
      'One special character',
    ]);
  });

  it('disables submit while the request is pending, then redirects to /app', async () => {
    let releaseResponse = () => {};
    let receivedBody: unknown;
    server.use(
      mock.post('*/api/auth/signup', async ({ request }) => {
        receivedBody = await request.json();
        await new Promise<void>((resolve) => {
          releaseResponse = resolve;
        });
        return HttpResponse.json(CREATED_USER, { status: 201 });
      }),
    );
    const form = renderForm();
    await fillValidForm(form);

    await form.user.click(form.submit);

    await waitFor(() => expect(form.submit).toBeDisabled());
    expect(form.submit).toHaveAttribute('aria-busy', 'true');
    expect(receivedBody).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Str0ng!pass',
    });
    expect(replace).not.toHaveBeenCalled();

    releaseResponse();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/app'));
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      user: {
        id: CREATED_USER.id,
        email: CREATED_USER.email,
        name: 'Jane Doe',
      },
    });
  });

  it('shows a 409 on the email field', async () => {
    server.use(
      mock.post('*/api/auth/signup', () =>
        HttpResponse.json(
          {
            statusCode: 409,
            message: 'Email already registered',
            error: 'Conflict',
            path: '/api/auth/signup',
            timestamp: new Date().toISOString(),
          },
          { status: 409 },
        ),
      ),
    );
    const form = renderForm();
    await fillValidForm(form);

    await form.user.click(form.submit);

    await waitFor(() =>
      expect(form.email).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(form.email).toHaveAccessibleDescription('Email already registered');
    expect(form.email).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(form.submit).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('puts backend 400 validation messages on the matching fields', async () => {
    server.use(
      mock.post('*/api/auth/signup', () =>
        HttpResponse.json(
          {
            statusCode: 400,
            message: [
              'Name must be between 3 and 50 characters',
              'Password must contain at least one special character',
            ],
            error: 'Bad Request',
            path: '/api/auth/signup',
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        ),
      ),
    );
    const form = renderForm();
    await fillValidForm(form);

    await form.user.click(form.submit);

    await waitFor(() =>
      expect(form.name).toHaveAccessibleDescription(
        'Name must be between 3 and 50 characters',
      ),
    );
    expect(form.name).toHaveFocus();
    expect(form.password).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Password must contain at least one special character'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
