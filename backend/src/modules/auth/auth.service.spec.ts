import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { Types } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => {
  const actual = jest.requireActual<typeof import('argon2')>('argon2');
  return { ...actual, verify: jest.fn(actual.verify) };
});

const PASSWORD = 'Str0ng!pass';

describe('AuthService', () => {
  const findByEmail = jest.fn<Promise<UserDocument | null>, unknown[]>();
  const create = jest.fn<Promise<UserDocument>, unknown[]>();
  const signAsync = jest.fn<Promise<string>, unknown[]>();
  const verifyMock = jest.mocked(verify);

  let service: AuthService;
  let user: UserDocument;

  beforeAll(async () => {
    service = new AuthService(
      { findByEmail, create } as unknown as UsersService,
      { signAsync } as unknown as JwtService,
    );
    await service.onModuleInit();

    user = {
      _id: new Types.ObjectId(),
      email: 'jane@example.com',
      name: 'Jane Doe',
      password: await hash(PASSWORD),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as unknown as UserDocument;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    signAsync.mockResolvedValue('signed.jwt');
  });

  async function signInError(
    email: string,
    password: string,
  ): Promise<UnauthorizedException> {
    const error: unknown = await service
      .signIn({ email, password })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UnauthorizedException);
    return error as UnauthorizedException;
  }

  describe('signIn', () => {
    it('returns the user and a token for valid credentials', async () => {
      findByEmail.mockResolvedValue(user);

      const result = await service.signIn({
        email: user.email,
        password: PASSWORD,
      });

      expect(findByEmail).toHaveBeenCalledWith(user.email, {
        includePassword: true,
      });
      expect(signAsync).toHaveBeenCalledWith({ sub: user._id.toString() });
      expect(result).toEqual({
        accessToken: 'signed.jwt',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
    });

    it('fails with the generic message for a wrong password', async () => {
      findByEmail.mockResolvedValue(user);

      const error = await signInError(user.email, 'Wr0ng!pass');

      expect(error.message).toBe('Invalid email or password');
      expect(signAsync).not.toHaveBeenCalled();
    });

    it('still runs argon2 verify against a dummy hash for an unknown email', async () => {
      findByEmail.mockResolvedValue(null);

      const error = await signInError('nobody@example.com', PASSWORD);

      expect(error.message).toBe('Invalid email or password');
      expect(verifyMock).toHaveBeenCalledTimes(1);
      const [dummyHash, password] = verifyMock.mock.calls[0];
      expect(dummyHash).toMatch(/^\$argon2id\$/);
      expect(dummyHash).not.toBe(user.password);
      expect(password).toBe(PASSWORD);
    });

    it('returns identical errors for unknown email and wrong password', async () => {
      findByEmail.mockResolvedValueOnce(null);
      const unknownEmail = await signInError('nobody@example.com', PASSWORD);
      findByEmail.mockResolvedValueOnce(user);
      const wrongPassword = await signInError(user.email, 'Wr0ng!pass');

      expect(unknownEmail.getResponse()).toEqual(wrongPassword.getResponse());
    });
  });

  describe('signUp', () => {
    it('stores an argon2 hash, never the plain password', async () => {
      create.mockResolvedValue(user);

      const result = await service.signUp({
        email: user.email,
        name: user.name,
        password: PASSWORD,
      });

      const [input] = create.mock.calls[0] as [{ passwordHash: string }];
      expect(input.passwordHash).toMatch(/^\$argon2id\$/);
      expect(JSON.stringify(create.mock.calls[0])).not.toContain(PASSWORD);
      expect(result.user).not.toHaveProperty('password');
      expect(JSON.stringify(result)).not.toContain(user.password);
    });
  });
});
