import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { EnvironmentVariables } from './environment-variables';
import { parseTrustProxy } from './trust-proxy';

/**
 * Everything that shapes request handling. Used by main.ts and the e2e test
 * app factory so production and tests cannot drift apart.
 */
export function configureApp(app: NestExpressApplication): void {
  app.useLogger(app.get(Logger));

  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  app.set(
    'trust proxy',
    parseTrustProxy(config.get('TRUST_PROXY', { infer: true })),
  );
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
