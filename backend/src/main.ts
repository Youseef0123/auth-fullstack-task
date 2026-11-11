import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment-variables';
import { SWAGGER_PATH, setupSwagger } from './config/swagger.config';
import { parseTrustProxy } from './config/trust-proxy';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

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
  app.enableShutdownHooks();
  setupSwagger(app);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(
    `API listening on port ${port}, docs at /${SWAGGER_PATH}`,
    'Bootstrap',
  );
}

void bootstrap();
