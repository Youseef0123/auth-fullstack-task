import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserResponseDto } from '../../modules/users/dto/user-response.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserResponseDto =>
    context.switchToHttp().getRequest<{ user: UserResponseDto }>().user,
);
