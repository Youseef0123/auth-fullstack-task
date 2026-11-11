import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { randomBytes } from 'node:crypto';
import { AUTH_MESSAGES } from '../../common/constants/auth.constants';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtPayload } from './jwt-payload.interface';

export interface AuthResult {
  user: UserResponseDto;
  accessToken: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyPasswordHash = '';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyPasswordHash = await hash(randomBytes(32).toString('hex'));
  }

  async signUp({ email, name, password }: SignUpDto): Promise<AuthResult> {
    const passwordHash = await hash(password);
    const user = await this.usersService.create({ email, name, passwordHash });
    return this.buildAuthResult(user);
  }

  async signIn({ email, password }: SignInDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email, {
      includePassword: true,
    });

    // Unknown emails are verified against a dummy hash so both paths take
    // comparable time and do not reveal which emails are registered.
    const isPasswordValid = await verify(
      user?.password ?? this.dummyPasswordHash,
      password,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.invalidCredentials);
    }
    return this.buildAuthResult(user);
  }

  private async buildAuthResult(user: UserDocument): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    return {
      user: UserResponseDto.fromUser(user),
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
