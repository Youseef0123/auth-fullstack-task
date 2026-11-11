import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { User } from '@/features/auth/types/auth.types';
import { ApiError } from '@/lib/api-error';

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

const API_USER: User = {
  id: '6650c0f2a1b2c3d4e5f60718',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const SESSION_USER = {
  id: API_USER.id,
  email: API_USER.email,
  name: API_USER.name,
};
const CREDENTIALS = { email: 'jane@example.com', password: 'Str0ng!pass' };

const state = () => useAuthStore.getState();

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'idle' });
    vi.mocked(authService.logout).mockResolvedValue(undefined);
  });

  it.each([
    ['signIn', () => state().signIn(CREDENTIALS), authService.signIn],
    [
      'signUp',
      () => state().signUp({ ...CREDENTIALS, name: 'Jane Doe' }),
      authService.signUp,
    ],
  ] as const)(
    '%s success -> authenticated with id/email/name only',
    async (_action, run, serviceCall) => {
      vi.mocked(serviceCall).mockResolvedValue(API_USER);

      await run();

      expect(state().status).toBe('authenticated');
      expect(state().user).toEqual(SESSION_USER);
      expect(state().user).not.toHaveProperty('createdAt');
    },
  );

  it('signIn failure rethrows and leaves the state untouched', async () => {
    const error = new ApiError(401, 'Invalid email or password');
    vi.mocked(authService.signIn).mockRejectedValue(error);

    await expect(state().signIn(CREDENTIALS)).rejects.toBe(error);
    expect(state()).toMatchObject({ user: null, status: 'idle' });
  });

  describe('fetchMe', () => {
    it('stores the session user', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(API_USER);

      await state().fetchMe();

      expect(state()).toMatchObject({
        user: SESSION_USER,
        status: 'authenticated',
      });
    });

    it('on 401 clears the cookie via logout and becomes unauthenticated', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(
        new ApiError(401, 'Unauthorized'),
      );

      await state().fetchMe();

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(state()).toMatchObject({ user: null, status: 'unauthenticated' });
    });

    it('on 401 still becomes unauthenticated when logout fails', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(
        new ApiError(401, 'Unauthorized'),
      );
      vi.mocked(authService.logout).mockRejectedValue(new ApiError(0, 'down'));

      await state().fetchMe();

      expect(state().status).toBe('unauthenticated');
    });

    it('on a network error rejects, keeps the session unknown and does not log out', async () => {
      const error = new ApiError(0, 'Unable to reach the server.');
      vi.mocked(authService.getMe).mockRejectedValue(error);

      await expect(state().fetchMe()).rejects.toBe(error);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(state()).toMatchObject({ user: null, status: 'idle' });
    });

    it('does not start a second request while one is in flight', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(API_USER);

      await Promise.all([state().fetchMe(), state().fetchMe()]);

      expect(authService.getMe).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('clears the user', async () => {
      useAuthStore.setState({ user: SESSION_USER, status: 'authenticated' });

      await state().logout();

      expect(state()).toMatchObject({ user: null, status: 'unauthenticated' });
    });

    it('keeps the session when the server could not clear the cookie', async () => {
      useAuthStore.setState({ user: SESSION_USER, status: 'authenticated' });
      vi.mocked(authService.logout).mockRejectedValue(new ApiError(0, 'down'));

      await expect(state().logout()).rejects.toBeInstanceOf(ApiError);
      expect(state()).toMatchObject({
        user: SESSION_USER,
        status: 'authenticated',
      });
    });
  });
});
