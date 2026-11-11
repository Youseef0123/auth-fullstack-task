import type { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'node:http';
import type { Connection } from 'mongoose';
import type { EnvironmentVariables } from '../../src/config/environment-variables';

export type TestEnv = Record<keyof EnvironmentVariables, string>;

export const TEST_JWT_SECRET =
  'e2e-test-secret-that-is-definitely-longer-than-32-chars';

/** Test defaults: throttling is effectively off unless a spec lowers it. */
export const BASE_TEST_ENV: Omit<TestEnv, 'MONGODB_URI'> = {
  NODE_ENV: 'test',
  PORT: '0',
  JWT_SECRET: TEST_JWT_SECRET,
  JWT_EXPIRES_IN: '1h',
  CORS_ORIGIN: 'http://localhost:3000',
  THROTTLE_TTL_MS: '60000',
  THROTTLE_LIMIT: '10000',
  TRUST_PROXY: 'false',
};

export interface TestApp {
  app: NestExpressApplication;
  server: Server;
  jwt: JwtService;
  connection: Connection;
  clearDatabase(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Builds the app exactly like main.ts (same module, same configureApp()).
 * ConfigModule validates process.env when app.module is first imported, so
 * every app is created from a fresh, isolated module registry after the
 * environment has been set.
 */
export async function createTestApp(
  mongoUri: string,
  overrides: Partial<TestEnv> = {},
): Promise<TestApp> {
  const previousEnv = { ...process.env };
  Object.assign(process.env, BASE_TEST_ENV, overrides, {
    MONGODB_URI: mongoUri,
  });

  try {
    return await buildApp();
  } finally {
    restoreEnv(previousEnv);
  }
}

/** The app reads its config during init, so the env can be restored right after. */
function restoreEnv(previousEnv: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in previousEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, previousEnv);
}

async function buildApp(): Promise<TestApp> {
  let testApp: TestApp | undefined;
  await jest.isolateModulesAsync(async () => {
    // requireActual (not import()) resolves from the isolated registry without ESM VM support.
    const { NestFactory } =
      jest.requireActual<typeof import('@nestjs/core')>('@nestjs/core');
    const { JwtService } =
      jest.requireActual<typeof import('@nestjs/jwt')>('@nestjs/jwt');
    const { getConnectionToken } =
      jest.requireActual<typeof import('@nestjs/mongoose')>('@nestjs/mongoose');
    const { AppModule } = jest.requireActual<
      typeof import('../../src/app.module')
    >('../../src/app.module');
    const { configureApp } = jest.requireActual<
      typeof import('../../src/config/configure-app')
    >('../../src/config/configure-app');

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
      abortOnError: false,
    });
    configureApp(app);
    await app.init();

    const connection = app.get<Connection>(getConnectionToken());
    // Unique indexes are built asynchronously; wait so duplicate checks are deterministic.
    await Promise.all(
      Object.values(connection.models).map((model) => model.init()),
    );

    testApp = {
      app,
      server: app.getHttpServer(),
      jwt: app.get(JwtService),
      connection,
      clearDatabase: async () => {
        await Promise.all(
          Object.values(connection.collections).map((collection) =>
            collection.deleteMany({}),
          ),
        );
      },
      close: () => app.close(),
    };
  });

  if (!testApp) {
    throw new Error('Test app was not created');
  }
  return testApp;
}
