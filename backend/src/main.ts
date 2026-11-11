import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment-variables';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
