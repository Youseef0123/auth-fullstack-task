import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './config/configure-app';
import { EnvironmentVariables } from './config/environment-variables';
import { SWAGGER_PATH, setupSwagger } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  configureApp(app);
  app.enableShutdownHooks();
  setupSwagger(app);

  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  app
    .get(Logger)
    .log(
      `API listening on port ${port}, docs at /${SWAGGER_PATH}`,
      'Bootstrap',
    );
}

void bootstrap();
