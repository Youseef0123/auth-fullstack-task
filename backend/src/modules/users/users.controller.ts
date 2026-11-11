import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../common/filters/error-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get the currently signed-in user' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Access token cookie is missing, invalid or expired',
  })
  me(@CurrentUser() user: UserResponseDto): UserResponseDto {
    return user;
  }
}
