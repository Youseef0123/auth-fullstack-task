import { JWT_SECRET_MIN_LENGTH, envValidationSchema } from './env.validation';
import { EnvironmentVariables } from './environment-variables';

const validEnv = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/auth-test',
  JWT_SECRET: 'x'.repeat(JWT_SECRET_MIN_LENGTH),
  CORS_ORIGIN: 'http://localhost:3000',
};

function parse(env: Record<string, unknown>): EnvironmentVariables {
  const result = envValidationSchema.validate(env);
  if (result.error) {
    throw result.error;
  }
  return result.value;
}

function validationError(env: Record<string, unknown>): string | undefined {
  return envValidationSchema.validate(env, { abortEarly: false }).error
    ?.message;
}

describe('envValidationSchema', () => {
  it('accepts a valid environment and applies defaults', () => {
    expect(parse(validEnv)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      JWT_EXPIRES_IN: '1d',
      THROTTLE_TTL_MS: 60_000,
      THROTTLE_LIMIT: 5,
    });
  });

  it('trusts no proxy when TRUST_PROXY is unset', () => {
    expect(parse(validEnv).TRUST_PROXY).toBe('false');
  });

  it.each(['false', '1', ' 10.0.0.0/8, loopback '])(
    'accepts TRUST_PROXY %p',
    (value) => {
      expect(parse({ ...validEnv, TRUST_PROXY: value }).TRUST_PROXY).toBe(
        value.trim(),
      );
    },
  );

  it.each(['true', 'localhost', '10.0.0.0/33'])(
    'rejects TRUST_PROXY %p',
    (value) => {
      expect(validationError({ ...validEnv, TRUST_PROXY: value })).toContain(
        '"TRUST_PROXY" must be "false", "loopback", a hop count',
      );
    },
  );

  it('accepts overridden throttle limits', () => {
    expect(
      parse({ ...validEnv, THROTTLE_TTL_MS: '1000', THROTTLE_LIMIT: '100' }),
    ).toMatchObject({ THROTTLE_TTL_MS: 1000, THROTTLE_LIMIT: 100 });
  });

  it('rejects a non-positive THROTTLE_LIMIT', () => {
    expect(validationError({ ...validEnv, THROTTLE_LIMIT: '0' })).toBe(
      '"THROTTLE_LIMIT" must be a positive number',
    );
  });

  it('coerces PORT to a number', () => {
    expect(parse({ ...validEnv, PORT: '5000' }).PORT).toBe(5000);
  });

  it('requires JWT_SECRET', () => {
    expect(
      validationError({
        MONGODB_URI: validEnv.MONGODB_URI,
        CORS_ORIGIN: validEnv.CORS_ORIGIN,
      }),
    ).toBe('"JWT_SECRET" is required');
  });

  it(`rejects a JWT_SECRET shorter than ${JWT_SECRET_MIN_LENGTH} characters`, () => {
    expect(
      validationError({
        ...validEnv,
        JWT_SECRET: 'x'.repeat(JWT_SECRET_MIN_LENGTH - 1),
      }),
    ).toBe(
      `"JWT_SECRET" length must be at least ${JWT_SECRET_MIN_LENGTH} characters long`,
    );
  });

  it.each(['3600', '0s', '1w', '-5m'])('rejects JWT_EXPIRES_IN %p', (value) => {
    expect(validationError({ ...validEnv, JWT_EXPIRES_IN: value })).toContain(
      '"JWT_EXPIRES_IN" must be a duration',
    );
  });

  it('rejects a non-mongodb MONGODB_URI', () => {
    expect(
      validationError({ ...validEnv, MONGODB_URI: 'postgres://localhost/db' }),
    ).toContain('"MONGODB_URI" must be a mongodb://');
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(validationError({ ...validEnv, NODE_ENV: 'staging' })).toContain(
      '"NODE_ENV" must be one of',
    );
  });

  it('reports every invalid variable at once', () => {
    const message = validationError({});

    expect(message).toContain('"MONGODB_URI" is required');
    expect(message).toContain('"JWT_SECRET" is required');
    expect(message).toContain('"CORS_ORIGIN" is required');
  });
});
