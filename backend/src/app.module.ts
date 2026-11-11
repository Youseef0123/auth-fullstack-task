import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { envValidationSchema } from './config/env.validation';
import { createLoggerConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),
  ],
})
export class AppModule {}
