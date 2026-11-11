import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Test } from 'supertest';
import type { ErrorResponseDto } from '../src/common/filters/error-response.dto';
import { expectNoPasswordLeaks } from './utils/assertions';
import { HttpClient } from './utils/http-client';
import { TestApp, TestEnv, createTestApp } from './utils/test-app';

/** This spec runs with the production limits instead of the raised test limits. */
const PRODUCTION_LIMITS: Partial<TestEnv> = {
  THROTTLE_LIMIT: '5',
  THROTTLE_TTL_MS: '60000',
};
const LIMIT = 5;
const APP_STARTUP_TIMEOUT_MS = 60_000;
const CREDENTIALS = { email: 'nobody@example.com', password: 'Wr0ng!pass' };
const CLIENT_A = '203.0.113.10';
const CLIENT_B = '203.0.113.20';

describe('Rate limiting & trust proxy (e2e)', () => {
  let mongod: MongoMemoryServer;
  let testApp: TestApp | undefined;
  let http: HttpClient | undefined;

  function client(): HttpClient {
    if (!http) {
      throw new Error('App not started');
    }
    return http;
  }

  /** Every test gets a fresh app, so throttle buckets never leak between tests. */
  function useFreshApp(env: Partial<TestEnv>): void {
    beforeEach(async () => {
      testApp = await createTestApp(mongod.getUri('throttling-e2e'), {
        ...PRODUCTION_LIMITS,
        ...env,
      });
      http = new HttpClient(testApp.server);
    }, APP_STARTUP_TIMEOUT_MS);
  }

  function signIn(forwardedFor?: string): Test {
    const request = client().post('/api/auth/signin');
    if (forwardedFor) {
      request.set('X-Forwarded-For', forwardedFor);
    }
    return request.send(CREDENTIALS);
  }

  async function exhaustSignIn(forwardedFor?: string): Promise<void> {
    for (let attempt = 1; attempt <= LIMIT; attempt += 1) {
      await signIn(forwardedFor).expect(401);
    }
  }

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  }, APP_STARTUP_TIMEOUT_MS);

  afterEach(async () => {
    expectNoPasswordLeaks(http?.responses ?? [], [CREDENTIALS.password]);
    await testApp?.close();
    testApp = undefined;
    http = undefined;
  });

  afterAll(async () => {
    await mongod?.stop();
  });

  describe('limits (default trust proxy)', () => {
    useFreshApp({});

    it('answers the 6th sign-in within the window with 429, unified shape and Retry-After', async () => {
      await exhaustSignIn();

      const response = await signIn().expect(429);
      const body = response.body as ErrorResponseDto;

      expect(Object.keys(body).sort()).toEqual([
        'error',
        'message',
        'path',
        'statusCode',
        'timestamp',
      ]);
      expect(body).toMatchObject({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
        path: '/api/auth/signin',
      });
      const retryAfter = Number(response.get('Retry-After'));
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('throttles sign-up in its own bucket and never throttles logout', async () => {
      for (let attempt = 1; attempt <= LIMIT; attempt += 1) {
        await client()
          .post('/api/auth/signup')
          .send({ email: 'bad' })
          .expect(400);
      }
      await client()
        .post('/api/auth/signup')
        .send({ email: 'bad' })
        .expect(429);

      await signIn().expect(401);
      for (let attempt = 1; attempt <= LIMIT * 2; attempt += 1) {
        await client().post('/api/auth/logout').expect(204);
      }
    });
  });

  describe('TRUST_PROXY=loopback (trusted local proxy, e.g. Next.js)', () => {
    useFreshApp({ TRUST_PROXY: 'loopback' });

    it('gives each forwarded client its own bucket', async () => {
      await exhaustSignIn(CLIENT_A);

      await signIn(CLIENT_A).expect(429);
      await signIn(CLIENT_B).expect(401);
    });

    it('ignores a client-forged X-Forwarded-For prefix', async () => {
      await exhaustSignIn(`198.51.100.1, ${CLIENT_A}`);

      // The trusted proxy appended CLIENT_A; only the forged left-most entry changed.
      await signIn(`198.51.100.2, ${CLIENT_A}`).expect(429);
    });
  });

  describe('TRUST_PROXY=false', () => {
    useFreshApp({ TRUST_PROXY: 'false' });

    it('does not let a spoofed X-Forwarded-For bypass the limit', async () => {
      await exhaustSignIn(CLIENT_A);

      await signIn(CLIENT_B).expect(429);
      await signIn().expect(429);
    });
  });
});
