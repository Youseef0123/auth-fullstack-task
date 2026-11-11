import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../../common/constants/auth.constants';
import { durationToMilliseconds } from '../../config/duration';
import { EnvironmentVariables } from '../../config/environment-variables';

@Injectable()
export class AuthCookieService {
  private readonly cookieOptions: CookieOptions;
  private readonly maxAge: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV', { infer: true }) === 'production',
      path: '/',
    };
    this.maxAge = durationToMilliseconds(
      config.get('JWT_EXPIRES_IN', { infer: true }),
    );
  }

  setAccessToken(response: Response, token: string): void {
    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      ...this.cookieOptions,
      maxAge: this.maxAge,
    });
  }

  clearAccessToken(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions);
  }
}
