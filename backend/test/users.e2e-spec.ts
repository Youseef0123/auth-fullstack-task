import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import type { ErrorResponseDto } from '../src/common/filters/error-response.dto';
import type { UserResponseDto } from '../src/modules/users/dto/user-response.dto';
import { expectNoPasswordLeaks, getSetCookie } from './utils/assertions';
import { HttpClient } from './utils/http-client';
import { TestApp, createTestApp } from './utils/test-app';

const PASSWORD = 'Str0ng!pass';
const USER = {
  email: 'jane@example.com',
  name: 'Jane Doe',
  password: PASSWORD,
};

const base64Url = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

describe('GET /api/users/me (e2e)', () => {
  let mongod: MongoMemoryServer;
  let testApp: TestApp;
  let http: HttpClient;
  let token: string;
  let user: UserResponseDto;

  const me = (cookieToken?: string): ReturnType<HttpClient['get']> => {
    const request = http.get('/api/users/me');
    return cookieToken === undefined
      ? request
      : request.set('Cookie', `access_token=${cookieToken}`);
  };

  const expectUnauthorized = async (cookieToken?: string): Promise<void> => {
    const response = await me(cookieToken).expect(401);
    expect(response.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      path: '/api/users/me',
    } satisfies Partial<ErrorResponseDto>);
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    testApp = await createTestApp(mongod.getUri('users-e2e'));
  }, 60_000);

  beforeEach(async () => {
    http = new HttpClient(testApp.server);
    const signup = await http.post('/api/auth/signup').send(USER).expect(201);
    user = signup.body as UserResponseDto;
    token = getSetCookie(signup, 'access_token')?.value ?? '';
  });

  afterEach(async () => {
    expectNoPasswordLeaks(http.responses, [PASSWORD]);
    await testApp.clearDatabase();
  });

  afterAll(async () => {
    await testApp?.close();
    await mongod?.stop();
  });

  it('returns the signed-in user', async () => {
    const response = await me(token).expect(200);

    expect(response.body).toEqual(user);
  });

  it('401 without a cookie', async () => {
    await expectUnauthorized();
  });

  it('401 with an empty cookie', async () => {
    await expectUnauthorized('');
  });

  it('401 with a tampered signature', async () => {
    const [header, payload, signature] = token.split('.');
    const flipped = signature.endsWith('A') ? 'B' : 'A';
    await expectUnauthorized(
      `${header}.${payload}.${signature.slice(0, -1)}${flipped}`,
    );
  });

  it('401 with a tampered payload', async () => {
    const [header, , signature] = token.split('.');
    const forged = base64Url({ sub: new Types.ObjectId().toString() });
    await expectUnauthorized(`${header}.${forged}.${signature}`);
  });

  it('401 with an unsigned (alg=none) token', async () => {
    const forged = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
      sub: user.id,
    })}.`;
    await expectUnauthorized(forged);
  });

  it('401 with a token signed by another secret', async () => {
    const foreign = testApp.jwt.sign(
      { sub: user.id },
      { secret: 'another-secret-that-is-at-least-32-characters' },
    );
    await expectUnauthorized(foreign);
  });

  it('401 with an expired token', async () => {
    const expired = testApp.jwt.sign({ sub: user.id }, { expiresIn: -60 });
    await expectUnauthorized(expired);
  });

  it('401 when the user no longer exists', async () => {
    await testApp.connection
      .collection('users')
      .deleteOne({ _id: new Types.ObjectId(user.id) });

    await expectUnauthorized(token);
  });

  it('401 (not 500) for a validly signed token with a malformed user id', async () => {
    const malformed = testApp.jwt.sign({
      sub: 'not-an-object-id',
      email: user.email,
    });
    await expectUnauthorized(malformed);
  });

  it('401 for garbage', async () => {
    await expectUnauthorized('not-a-jwt');
  });
});
