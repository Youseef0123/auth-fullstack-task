import { HttpResponse, http as mock } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiError, UNEXPECTED_ERROR_MESSAGE } from '@/lib/api-error';
import { http } from '@/lib/http';

const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Check your connection and try again.';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function backendError(statusCode: number, message: string | string[]) {
  return HttpResponse.json(
    {
      statusCode,
      message,
      error: 'Error',
      path: '/api/test',
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}

/** Calls the client and returns the error it rejected with. */
async function failingRequest(): Promise<ApiError> {
  const error: unknown = await http.post('/test', {}).then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe('http client', () => {
  it('calls the same-origin /api proxy with credentials', async () => {
    let requestUrl = '';
    server.use(
      mock.get('*/api/users/me', ({ request }) => {
        requestUrl = new URL(request.url).pathname;
        return HttpResponse.json({ ok: true });
      }),
    );

    const response = await http.get('/users/me');

    expect(requestUrl).toBe('/api/users/me');
    expect(response.data).toEqual({ ok: true });
    expect(http.defaults.withCredentials).toBe(true);
  });

  describe('error normalization', () => {
    it('maps a 400 message array onto fields by known message', async () => {
      server.use(
        mock.post('*/api/test', () =>
          backendError(400, [
            'Please enter a valid email address',
            'Name must be between 3 and 50 characters',
            'Password must contain at least one number',
          ]),
        ),
      );

      const error = await failingRequest();

      expect(error.statusCode).toBe(400);
      expect(error.fieldErrors).toEqual({
        email: 'Please enter a valid email address',
        name: 'Name must be between 3 and 50 characters',
        password: 'Password must contain at least one number',
      });
    });

    it('keeps the first message per field and surfaces unknown messages', async () => {
      server.use(
        mock.post('*/api/test', () =>
          backendError(400, [
            'property role should not exist',
            'Password is required',
            'Password must be at least 8 characters',
          ]),
        ),
      );

      const error = await failingRequest();

      expect(error.fieldErrors).toEqual({ password: 'Password is required' });
      expect(error.message).toBe('property role should not exist');
    });

    it('has no fieldErrors when no message matches a field', async () => {
      server.use(
        mock.post('*/api/test', () =>
          backendError(400, 'property role should not exist'),
        ),
      );

      const error = await failingRequest();

      expect(error.fieldErrors).toBeUndefined();
      expect(error.message).toBe('property role should not exist');
    });

    it.each([
      [401, 'Invalid email or password'],
      [409, 'Email already registered'],
    ])('passes a %i message through', async (status, message) => {
      server.use(mock.post('*/api/test', () => backendError(status, message)));

      const error = await failingRequest();

      expect(error).toMatchObject({ statusCode: status, message });
      expect(error.fieldErrors).toBeUndefined();
    });

    it('replaces the 429 message with user-facing copy', async () => {
      server.use(
        mock.post('*/api/test', () =>
          backendError(429, 'Too many requests, please try again later'),
        ),
      );

      const error = await failingRequest();

      expect(error).toMatchObject({
        statusCode: 429,
        message: 'Too many attempts, please try again later',
      });
    });

    it('reports a network failure with status 0', async () => {
      server.use(mock.post('*/api/test', () => HttpResponse.error()));

      const error = await failingRequest();

      expect(error).toMatchObject({
        statusCode: 0,
        message: NETWORK_ERROR_MESSAGE,
      });
    });

    it('treats a body that is not ours (proxy failure) as unreachable', async () => {
      server.use(
        mock.post('*/api/test', () => new HttpResponse(null, { status: 500 })),
      );

      const error = await failingRequest();

      expect(error).toMatchObject({
        statusCode: 500,
        message: NETWORK_ERROR_MESSAGE,
      });
    });

    it('hides backend 5xx details behind a generic message', async () => {
      server.use(
        mock.post('*/api/test', () =>
          backendError(500, 'Internal server error'),
        ),
      );

      const error = await failingRequest();

      expect(error).toMatchObject({
        statusCode: 500,
        message: UNEXPECTED_ERROR_MESSAGE,
      });
    });
  });
});

describe('ApiError.from', () => {
  it('returns an ApiError unchanged', () => {
    const error = new ApiError(409, 'Email already registered');
    expect(ApiError.from(error)).toBe(error);
  });

  it('wraps anything else as an unexpected error', () => {
    expect(ApiError.from(new Error('boom'))).toMatchObject({
      statusCode: 0,
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  });
});
