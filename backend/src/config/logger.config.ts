import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { EnvironmentVariables, NodeEnvironment } from './environment-variables';

const LOG_LEVELS: Record<NodeEnvironment, string> = {
  development: 'debug',
  production: 'info',
  test: 'silent',
};

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

export function createLoggerConfig(
  config: ConfigService<EnvironmentVariables, true>,
): Params {
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const isProduction = nodeEnv === 'production';

  return {
    pinoHttp: {
      level: LOG_LEVELS[nodeEnv],
      redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
    },
  };
}
