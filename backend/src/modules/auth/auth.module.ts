import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import {
  AUTH_MESSAGES,
  JWT_ALGORITHM,
} from '../../common/constants/auth.constants';
import { durationToSeconds } from '../../config/duration';
import { EnvironmentVariables } from '../../config/environment-variables';
import { UsersModule } from '../users/users.module';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): JwtModuleOptions => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: durationToSeconds(
            config.get('JWT_EXPIRES_IN', { infer: true }),
          ),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_LIMIT', { infer: true }),
          },
        ],
        errorMessage: AUTH_MESSAGES.tooManyRequests,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieService, JwtStrategy],
})
export class AuthModule {}
