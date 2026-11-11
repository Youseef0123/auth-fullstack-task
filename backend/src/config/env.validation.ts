import Joi from 'joi';
import { DURATION_PATTERN } from './duration';
import {
  EnvironmentVariables,
  NODE_ENVIRONMENTS,
} from './environment-variables';
import { isValidTrustProxy } from './trust-proxy';

export const JWT_SECRET_MIN_LENGTH = 32;

export const envValidationSchema = Joi.object<EnvironmentVariables, true>({
  NODE_ENV: Joi.string()
    .valid(...NODE_ENVIRONMENTS)
    .default('development'),
  PORT: Joi.number().port().default(4000),
  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\/.+/)
    .required()
    .messages({
      'string.pattern.base':
        '"MONGODB_URI" must be a mongodb:// or mongodb+srv:// connection string',
    }),
  JWT_SECRET: Joi.string().min(JWT_SECRET_MIN_LENGTH).required(),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(DURATION_PATTERN)
    .default('1d')
    .messages({
      'string.pattern.base':
        '"JWT_EXPIRES_IN" must be a duration such as 15m, 1h or 1d',
    }),
  CORS_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  THROTTLE_TTL_MS: Joi.number().integer().positive().default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(5),
  // Unset means "trust no proxy": X-Forwarded-For is ignored unless explicitly enabled.
  TRUST_PROXY: Joi.string()
    .trim()
    .default('false')
    .custom((value: string, helpers) =>
      isValidTrustProxy(value) ? value : helpers.error('any.invalid'),
    )
    .messages({
      'any.invalid':
        '"TRUST_PROXY" must be "false", "loopback", a hop count (e.g. 1) or a comma-separated list of IPs/CIDRs',
    }),
});
