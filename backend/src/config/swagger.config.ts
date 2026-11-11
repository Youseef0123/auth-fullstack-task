import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE } from '../common/constants/auth.constants';

export const SWAGGER_PATH = 'api/docs';

export function setupSwagger(app: INestApplication): void {
  const documentConfig = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription(
      `Sign up / sign in API. Authenticated endpoints read the JWT from the httpOnly "${ACCESS_TOKEN_COOKIE}" cookie.`,
    )
    .setVersion('1.0.0')
    .addCookieAuth(ACCESS_TOKEN_COOKIE)
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, documentConfig),
  );
}
