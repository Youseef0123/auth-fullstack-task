import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Response, Test } from 'supertest';
import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  PASSWORD_MESSAGES,
} from '../src/common/constants/validation.constants';
import type { ErrorResponseDto } from '../src/common/filters/error-response.dto';
import type { UserResponseDto } from '../src/modules/users/dto/user-response.dto';
import { expectNoPasswordLeaks, getSetCookie } from './utils/assertions';
import { HttpClient } from './utils/http-client';
import { TestApp, createTestApp } from './utils/test-app';

const PASSWORD = 'Str0ng!pass';
const WRONG_PASSWORD = 'Wr0ng!pass';
const USER = {
  email: 'jane@example.com',
  name: 'Jane Doe',
  password: PASSWORD,
};
/** BASE_TEST_ENV sets JWT_EXPIRES_IN=1h. */
const EXPECTED_MAX_AGE_SECONDS = '3600';
const PUBLIC_USER_FIELDS = ['createdAt', 'email', 'id', 'name'];

function withoutTimestamp(
  response: Response,
): Omit<ErrorResponseDto, 'timestamp'> {
  const { statusCode, message, error, path } =
    response.body as ErrorResponseDto;
  return { statusCode, message, error, path };
}

describe('Auth (e2e)', () => {
  let mongod: MongoMemoryServer;
  let testApp: TestApp;
  let http: HttpClient;

  const signUp = (body: Record<string, unknown> = USER): Test =>
    http.post('/api/auth/signup').send(body);
  const countUsers = (): Promise<number> =>
    testApp.connection.collection('users').countDocuments();

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    testApp = await createTestApp(mongod.getUri('auth-e2e'));
  }, 60_000);

  beforeEach(() => {
    http = new HttpClient(testApp.server);
  });

  afterEach(async () => {
    expectNoPasswordLeaks(http.responses, [PASSWORD, WRONG_PASSWORD]);
    await testApp.clearDatabase();
  });

  afterAll(async () => {
    await testApp?.close();
    await mongod?.stop();
  });

  it('runs a full session: signup -> /users/me -> logout -> 401', async () => {
    const browser = http.agent();

    const signup = await browser
      .post('/api/auth/signup')
      .send(USER)
      .expect(201);
    expect(getSetCookie(signup, 'access_token')?.value).toMatch(/^ey/);

    const me = await browser.get('/api/users/me').expect(200);
    expect(me.body).toEqual(signup.body);

    await browser.post('/api/auth/logout').expect(204);
    await browser.get('/api/users/me').expect(401);
  });

  describe('POST /api/auth/signup', () => {
    it('creates the user and returns only public fields', async () => {
      const response = await signUp().expect(201);
      const body = response.body as UserResponseDto;

      expect(Object.keys(body).sort()).toEqual(PUBLIC_USER_FIELDS);
      expect(body).toMatchObject({ email: USER.email, name: USER.name });
      expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    });

    it('trims/lowercases input and stores an argon2id hash', async () => {
      const response = await signUp({
        ...USER,
        email: '  Jane@Example.COM ',
        name: '  Jane Doe  ',
      }).expect(201);

      expect(response.body).toMatchObject({
        email: 'jane@example.com',
        name: 'Jane Doe',
      });
      const stored = await testApp.connection
        .collection('users')
        .findOne({ email: 'jane@example.com' });
      expect(stored?.password).toMatch(/^\$argon2id\$/);
    });

    it.each(['JANE@EXAMPLE.COM', '  jane@example.com  ', ' Jane@Example.Com'])(
      'rejects the duplicate email %p with 409',
      async (email) => {
        await signUp().expect(201);

        const response = await signUp({ ...USER, email }).expect(409);

        expect(withoutTimestamp(response)).toEqual({
          statusCode: 409,
          message: 'Email already registered',
          error: 'Conflict',
          path: '/api/auth/signup',
        });
        expect(await countUsers()).toBe(1);
      },
    );

    it.each([
      ['malformed email', { email: 'not-an-email' }, EMAIL_MESSAGES.invalid],
      ['missing email', { email: undefined }, EMAIL_MESSAGES.invalid],
      ['name too short', { name: 'ab' }, NAME_MESSAGES.length],
      ['blank name', { name: '   ' }, NAME_MESSAGES.length],
      ['name too long', { name: 'x'.repeat(51) }, NAME_MESSAGES.length],
      ['missing password', { password: undefined }, PASSWORD_MESSAGES.required],
      ['password too short', { password: 'Ab1!' }, PASSWORD_MESSAGES.minLength],
      [
        'password too long',
        { password: `A1!${'a'.repeat(126)}` },
        PASSWORD_MESSAGES.maxLength,
      ],
      [
        'password without letter',
        { password: '12345678!' },
        PASSWORD_MESSAGES.letter,
      ],
      [
        'password without number',
        { password: 'Password!' },
        PASSWORD_MESSAGES.number,
      ],
      [
        'password without special character',
        { password: 'Passw0rd' },
        PASSWORD_MESSAGES.specialCharacter,
      ],
    ])(
      'rejects %s with 400 and one clear message',
      async (_case, patch, message) => {
        const response = await signUp({ ...USER, ...patch }).expect(400);

        expect(withoutTimestamp(response)).toEqual({
          statusCode: 400,
          message: [message],
          error: 'Bad Request',
          path: '/api/auth/signup',
        });
        expect(await countUsers()).toBe(0);
      },
    );

    // Length is counted in characters (code points) on both sides, not UTF-16
    // units: 48 and 26 characters are valid names even though they are 51 and
    // 52 units long. These once returned 500 from a stricter Mongoose schema.
    it.each([
      ['45 letters + 3 emoji', `${'x'.repeat(45)}${'🎉'.repeat(3)}`],
      ['26 emoji', '😀'.repeat(26)],
    ])('accepts a name of %s (201)', async (_case, name) => {
      const response = await signUp({ ...USER, name }).expect(201);

      expect((response.body as UserResponseDto).name).toBe(name);
      expect(await countUsers()).toBe(1);
    });

    it('rejects 51 emoji with the same 400 as any over-long name', async () => {
      const response = await signUp({ ...USER, name: '😀'.repeat(51) }).expect(
        400,
      );

      expect((response.body as ErrorResponseDto).message).toEqual([
        NAME_MESSAGES.length,
      ]);
    });

    it('rejects unknown fields such as "role" with 400', async () => {
      const response = await signUp({ ...USER, role: 'admin' }).expect(400);

      expect((response.body as ErrorResponseDto).message).toEqual([
        'property role should not exist',
      ]);
      expect(await countUsers()).toBe(0);
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      await signUp().expect(201);
    });

    it('signs in with a differently-cased email and sets the auth cookie', async () => {
      const response = await http
        .post('/api/auth/signin')
        .send({ email: '  JANE@example.com ', password: PASSWORD })
        .expect(200);

      expect(Object.keys(response.body as UserResponseDto).sort()).toEqual(
        PUBLIC_USER_FIELDS,
      );
      expect(getSetCookie(response, 'access_token')?.value).toMatch(/^ey/);
    });

    it('returns identical 401 bodies for a wrong password and an unknown email', async () => {
      const wrongPassword = await http
        .post('/api/auth/signin')
        .send({ email: USER.email, password: WRONG_PASSWORD })
        .expect(401);
      const unknownEmail = await http
        .post('/api/auth/signin')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);

      expect(withoutTimestamp(wrongPassword)).toEqual({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
        path: '/api/auth/signin',
      });
      expect(withoutTimestamp(unknownEmail)).toEqual(
        withoutTimestamp(wrongPassword),
      );
      expect(wrongPassword.get('Set-Cookie')).toBeUndefined();
      expect(unknownEmail.get('Set-Cookie')).toBeUndefined();
    });

    it('rejects a malformed email with 400', async () => {
      await http
        .post('/api/auth/signin')
        .send({ email: 'jane', password: PASSWORD })
        .expect(400);
    });
  });

  describe('auth cookie', () => {
    it('is HttpOnly, SameSite=Lax, Path=/ with Max-Age from JWT_EXPIRES_IN (not Secure outside production)', async () => {
      const cookie = getSetCookie(await signUp().expect(201), 'access_token');

      expect(cookie?.attributes.has('httponly')).toBe(true);
      expect(cookie?.attributes.get('samesite')).toBe('Lax');
      expect(cookie?.attributes.get('path')).toBe('/');
      expect(cookie?.attributes.get('max-age')).toBe(EXPECTED_MAX_AGE_SECONDS);
      expect(cookie?.attributes.has('secure')).toBe(false);
    });

    it('carries a JWT whose payload holds only the user id', async () => {
      const response = await signUp().expect(201);
      const token = getSetCookie(response, 'access_token')?.value ?? '';
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
      ) as Record<string, unknown>;

      expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
      expect(payload.sub).toBe((response.body as UserResponseDto).id);
    });

    it('is cleared on logout with the same attributes', async () => {
      const set = getSetCookie(await signUp().expect(201), 'access_token');
      const cleared = getSetCookie(
        await http.post('/api/auth/logout').expect(204),
        'access_token',
      );

      expect(cleared?.value).toBe('');
      expect(cleared?.attributes.get('expires')).toBe(
        'Thu, 01 Jan 1970 00:00:00 GMT',
      );
      for (const attribute of ['httponly', 'samesite', 'path', 'secure']) {
        expect(cleared?.attributes.get(attribute)).toBe(
          set?.attributes.get(attribute),
        );
      }
    });

    it('logout without a session still returns 204', async () => {
      await http.post('/api/auth/logout').expect(204);
    });
  });

  describe('in production mode', () => {
    let productionApp: TestApp;

    beforeAll(async () => {
      productionApp = await createTestApp(mongod.getUri('auth-e2e-prod'), {
        NODE_ENV: 'production',
      });
    }, 60_000);

    afterAll(async () => {
      await productionApp?.close();
    });

    it('marks the auth cookie Secure when setting and clearing it', async () => {
      const productionHttp = new HttpClient(productionApp.server);

      const signup = await productionHttp
        .post('/api/auth/signup')
        .send(USER)
        .expect(201);
      const logout = await productionHttp.post('/api/auth/logout').expect(204);

      expect(
        getSetCookie(signup, 'access_token')?.attributes.has('secure'),
      ).toBe(true);
      expect(
        getSetCookie(logout, 'access_token')?.attributes.has('secure'),
      ).toBe(true);
      expectNoPasswordLeaks(productionHttp.responses, [PASSWORD]);
    });
  });
});
