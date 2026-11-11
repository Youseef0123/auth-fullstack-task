import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length } from 'class-validator';
import {
  EMAIL_MESSAGES,
  NAME_MESSAGES,
  NAME_RULES,
  PASSWORD_RULES,
} from '../../../common/constants/validation.constants';
import { IsPassword } from '../../../common/decorators/is-password.decorator';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class SignUpDto {
  @ApiProperty({
    example: 'jane@example.com',
    format: 'email',
    description: 'Trimmed and lowercased before saving',
  })
  @NormalizeEmail()
  @IsEmail({}, { message: EMAIL_MESSAGES.invalid })
  email!: string;

  @ApiProperty({
    example: 'Jane Doe',
    minLength: NAME_RULES.minLength,
    maxLength: NAME_RULES.maxLength,
    description: 'Trimmed before validation',
  })
  @Trim()
  @Length(NAME_RULES.minLength, NAME_RULES.maxLength, {
    message: NAME_MESSAGES.length,
  })
  name!: string;

  @ApiProperty({
    example: 'Str0ng!pass',
    minLength: PASSWORD_RULES.minLength,
    maxLength: PASSWORD_RULES.maxLength,
    pattern: PASSWORD_RULES.pattern.source,
    description: 'At least one letter, one number and one special character',
  })
  @IsPassword()
  password!: string;
}
