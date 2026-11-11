import { ConflictException } from '@nestjs/common';
import { Model, Types, mongo } from 'mongoose';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const exec = jest.fn();
  const select = jest.fn();
  const findOne = jest.fn();
  const findById = jest.fn();
  const create = jest.fn();
  const service = new UsersService({
    findOne,
    findById,
    create,
  } as unknown as Model<User>);

  beforeEach(() => {
    jest.clearAllMocks();
    const query = { select, exec };
    select.mockReturnValue(query);
    findOne.mockReturnValue(query);
    findById.mockReturnValue(query);
  });

  describe('findByEmail', () => {
    it('normalizes the email and excludes the password by default', async () => {
      await service.findByEmail('  Jane@Example.COM ');

      expect(findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
      expect(select).not.toHaveBeenCalled();
    });

    it('selects the password only when asked', async () => {
      await service.findByEmail('jane@example.com', { includePassword: true });

      expect(select).toHaveBeenCalledWith('+password');
    });
  });

  describe('findById', () => {
    it('returns null for a malformed id without querying', async () => {
      await expect(service.findById('not-an-id')).resolves.toBeNull();
      expect(findById).not.toHaveBeenCalled();
    });

    it('queries by a valid id', async () => {
      const id = new Types.ObjectId().toString();
      await service.findById(id);

      expect(findById).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    const input = {
      email: 'jane@example.com',
      name: 'Jane Doe',
      passwordHash: '$argon2id$hash',
    };

    it('stores the hash in the password field', async () => {
      await service.create(input);

      expect(create).toHaveBeenCalledWith({
        email: input.email,
        name: input.name,
        password: input.passwordHash,
      });
    });

    it('maps a duplicate key error to a 409 conflict', async () => {
      create.mockRejectedValue(
        new mongo.MongoServerError({
          message: 'E11000 duplicate key',
          code: 11000,
        }),
      );

      const error: unknown = await service
        .create(input)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toBe(
        'Email already registered',
      );
    });

    it('rethrows other errors', async () => {
      const failure = new Error('connection lost');
      create.mockRejectedValue(failure);

      await expect(service.create(input)).rejects.toBe(failure);
    });
  });
});
