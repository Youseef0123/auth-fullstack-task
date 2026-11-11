import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, mongo } from 'mongoose';
import { AUTH_MESSAGES } from '../../common/constants/auth.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

const DUPLICATE_KEY_ERROR_CODE = 11000;

interface FindByEmailOptions {
  includePassword?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  findByEmail(
    email: string,
    { includePassword = false }: FindByEmailOptions = {},
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.trim().toLowerCase() });
    return (includePassword ? query.select('+password') : query).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    if (!isValidObjectId(id)) {
      return Promise.resolve(null);
    }
    return this.userModel.findById(id).exec();
  }

  async create({
    email,
    name,
    passwordHash,
  }: CreateUserDto): Promise<UserDocument> {
    try {
      return await this.userModel.create({
        email,
        name,
        password: passwordHash,
      });
    } catch (error) {
      if (
        error instanceof mongo.MongoServerError &&
        error.code === DUPLICATE_KEY_ERROR_CODE
      ) {
        throw new ConflictException(AUTH_MESSAGES.emailTaken);
      }
      throw error;
    }
  }
}
