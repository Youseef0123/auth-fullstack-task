import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { ErrorResponseDto } from '../src/common/filters/error-response.dto';
import type { HealthResponseDto } from '../src/modules/health/dto/health-response.dto';
import { expectNoPasswordLeaks, findPasswordLeaks } from './utils/assertions';
import { HttpClient } from './utils/http-client';
import { TestApp, createTestApp } from './utils/test-app';

interface OpenApiDocument {
  paths: Record<
    string,
    Record<string, { responses: Record<string, unknown>; security?: unknown }>
  >;
  components: {
    schemas: Record<string, { properties?: Record<string, unknown> }>;
    securitySchemes: Record<string, unknown>;
  };
}

const DOCUMENTED_ENDPOINTS: [path: string, method: string, codes: string[]][] =
  [
    ['/api/health', 'get', ['200', '503']],
    ['/api/auth/signup', 'post', ['201', '400', '409', '429']],
    ['/api/auth/signin', 'post', ['200', '400', '401', '429']],
    ['/api/auth/logout', 'post', ['204']],
    ['/api/users/me', 'get', ['200', '401']],
  ];

describe('Health & app wiring (e2e)', () => {
  let mongod: MongoMemoryServer;
  let testApp: TestApp;
  let http: HttpClient;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    testApp = await createTestApp(mongod.getUri('health-e2e'));
  }, 60_000);

  beforeEach(() => {
    http = new HttpClient(testApp.server);
  });

  /**
   * Fetched outside the recording client: the OpenAPI schema legitimately
   * names the password *input* field, which the global leak check would flag.
   */
  const fetchOpenApiDocument = async (): Promise<OpenApiDocument> =>
    (await request(testApp.server).get('/api/docs-json').expect(200))
      .body as OpenApiDocument;

  afterEach(() => {
    expectNoPasswordLeaks(http.responses, []);
  });

  afterAll(async () => {
    await testApp?.close();
    await mongod?.stop();
  });

  it('GET /api/health reports the API and database as up', async () => {
    const response = await http.get('/api/health').expect(200);
    const body = response.body as HealthResponseDto;

    expect(body).toMatchObject({ status: 'ok', database: 'up' });
    expect(typeof body.uptime).toBe('number');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('serves routes only under the /api prefix', async () => {
    await http.get('/health').expect(404);
  });

  it('returns unknown routes in the unified error shape', async () => {
    const response = await http.get('/api/does-not-exist').expect(404);
    const body = response.body as ErrorResponseDto;

    expect(Object.keys(body).sort()).toEqual([
      'error',
      'message',
      'path',
      'statusCode',
      'timestamp',
    ]);
    expect(body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/api/does-not-exist',
    });
  });

  it('applies helmet security headers and credentialed CORS', async () => {
    const response = await http
      .get('/api/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.get('Content-Security-Policy')).toContain(
      "default-src 'self'",
    );
    expect(response.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:3000',
    );
    expect(response.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('rejects malformed JSON with a 400 in the unified error shape', async () => {
    const response = await http
      .post('/api/auth/signin')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);

    expect((response.body as ErrorResponseDto).error).toBe('Bad Request');
  });

  it('answers an oversized JSON body with 413, not 500', async () => {
    const response = await http
      .post('/api/auth/signup')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'x'.repeat(200 * 1024) }))
      .expect(413);

    expect(response.body).toMatchObject({
      statusCode: 413,
      message: 'request entity too large',
      error: 'Payload Too Large',
      path: '/api/auth/signup',
    });
  });

  it('serves Swagger UI at /api/docs', async () => {
    await http
      .get('/api/docs')
      .expect(200)
      .expect('Content-Type', /text\/html/);
  });

  it.each(DOCUMENTED_ENDPOINTS)(
    'documents %s %s with its responses',
    async (path, method, codes) => {
      const operation = (await fetchOpenApiDocument()).paths[path]?.[method];

      const documented = Object.keys(operation?.responses ?? {});
      expect(codes.filter((code) => !documented.includes(code))).toEqual([]);
    },
  );

  it('documents cookie auth and never exposes a password in the user schema', async () => {
    const doc = await fetchOpenApiDocument();

    // The only password-named keys are the documented *input* fields.
    expect(findPasswordLeaks(doc).sort()).toEqual([
      'body.components.schemas.SignInDto.properties.password',
      'body.components.schemas.SignUpDto.properties.password',
    ]);
    expect(doc.components.securitySchemes.cookie).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    });
    expect(doc.paths['/api/users/me'].get.security).toEqual([{ cookie: [] }]);
    expect(
      Object.keys(doc.components.schemas.UserResponseDto.properties ?? {}),
    ).toEqual(['id', 'email', 'name', 'createdAt']);
  });

  describe('when the database connection is down', () => {
    let disconnectedApp: TestApp;

    beforeAll(async () => {
      disconnectedApp = await createTestApp(mongod.getUri('health-e2e-down'));
      await disconnectedApp.connection.close();
    }, 60_000);

    afterAll(async () => {
      await disconnectedApp?.close();
    });

    it('GET /api/health answers 503 in the unified error shape', async () => {
      const response = await new HttpClient(disconnectedApp.server)
        .get('/api/health')
        .expect(503);

      expect(response.body).toMatchObject({
        statusCode: 503,
        message: 'Database connection is down',
        error: 'Service Unavailable',
        path: '/api/health',
      } satisfies Partial<ErrorResponseDto>);
    });
  });
});
