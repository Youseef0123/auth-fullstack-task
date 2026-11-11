import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment-variables';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
