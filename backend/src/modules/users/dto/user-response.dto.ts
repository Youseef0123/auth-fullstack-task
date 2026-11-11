import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty({ example: '6650c0f2a1b2c3d4e5f60718' })
  id!: string;

  @ApiProperty({ example: 'jane@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  /** Builds the response from an explicit allow-list of fields, so the password hash can never be serialized. */
  static fromUser(
    user: Pick<UserDocument, '_id' | 'email' | 'name' | 'createdAt'>,
  ): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
