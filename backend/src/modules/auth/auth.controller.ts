import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../../common/constants/auth.constants';
import { ErrorResponseDto } from '../../common/filters/error-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

const SET_COOKIE_HEADER = {
  'Set-Cookie': {
    description: `httpOnly "${ACCESS_TOKEN_COOKIE}" cookie holding the JWT (SameSite=Lax, Path=/, Secure in production)`,
    schema: { type: 'string' },
  },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create an account and start a session' })
  @ApiCreatedResponse({ type: UserResponseDto, headers: SET_COOKIE_HEADER })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation failed',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already registered',
  })
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const { user, accessToken } = await this.authService.signUp(dto);
    this.authCookieService.setAccessToken(response, accessToken);
    return user;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in and start a session' })
  @ApiOkResponse({ type: UserResponseDto, headers: SET_COOKIE_HEADER })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation failed',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid email or password',
  })
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const { user, accessToken } = await this.authService.signIn(dto);
    this.authCookieService.setAccessToken(response, accessToken);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End the session by clearing the auth cookie' })
  @ApiNoContentResponse({
    description: `Clears the "${ACCESS_TOKEN_COOKIE}" cookie`,
  })
  logout(@Res({ passthrough: true }) response: Response): void {
    this.authCookieService.clearAccessToken(response);
  }
}
