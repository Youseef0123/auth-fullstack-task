import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { EnvironmentVariables } from '../../config/environment-variables';
import { AuthCookieService } from './auth-cookie.service';

function createService(
  env: Partial<EnvironmentVariables> = {},
): AuthCookieService {
  const values: Partial<EnvironmentVariables> = {
    NODE_ENV: 'development',
    JWT_EXPIRES_IN: '1d',
    ...env,
  };
  const config = {
    get: (key: keyof EnvironmentVariables) => values[key],
  } as unknown as ConfigService<EnvironmentVariables, true>;
  return new AuthCookieService(config);
}

describe('AuthCookieService', () => {
  const cookie = jest.fn<void, [string, string, CookieOptions]>();
  const clearCookie = jest.fn<void, [string, CookieOptions]>();
  const response = { cookie, clearCookie } as unknown as Response;

  beforeEach(() => {
    cookie.mockClear();
    clearCookie.mockClear();
  });

  it('sets an httpOnly, SameSite=Lax cookie on / with maxAge from JWT_EXPIRES_IN', () => {
    createService().setAccessToken(response, 'jwt-token');

    expect(cookie).toHaveBeenCalledWith('access_token', 'jwt-token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 86_400_000,
    });
  });

  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
  ])('converts JWT_EXPIRES_IN %p to a maxAge of %p ms', (expiresIn, maxAge) => {
    createService({ JWT_EXPIRES_IN: expiresIn }).setAccessToken(response, 't');

    expect(cookie).toHaveBeenCalledWith(
      'access_token',
      't',
      expect.objectContaining({ maxAge }),
    );
  });

  it('marks the cookie secure in production', () => {
    createService({ NODE_ENV: 'production' }).setAccessToken(response, 't');

    expect(cookie).toHaveBeenCalledWith(
      'access_token',
      't',
      expect.objectContaining({ secure: true }),
    );
  });

  it('clears the cookie with the same attributes it was set with', () => {
    const service = createService({ NODE_ENV: 'production' });
    service.setAccessToken(response, 't');
    service.clearAccessToken(response);

    const [, , setOptions] = cookie.mock.calls[0];
    const [clearedName, clearOptions] = clearCookie.mock.calls[0];
    expect(clearedName).toBe('access_token');
    expect(clearOptions).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
    expect(setOptions).toEqual({ ...clearOptions, maxAge: 86_400_000 });
  });
});
