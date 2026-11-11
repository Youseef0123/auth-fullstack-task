import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';
import {
  EMAIL_MESSAGES,
  PASSWORD_MESSAGES,
} from '../../../common/constants/validation.constants';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator';

export class SignInDto {
  @ApiProperty({ example: 'jane@example.com', format: 'email' })
  @NormalizeEmail()
  @IsEmail({}, { message: EMAIL_MESSAGES.invalid })
  email!: string;

  @ApiProperty({ example: 'Str0ng!pass' })
  @MinLength(1, { message: PASSWORD_MESSAGES.required })
  password!: string;
}
