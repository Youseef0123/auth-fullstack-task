import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorResponseDto } from './error-response.dto';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';
const SERVER_ERROR_MIN_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;

type ErrorDetails = Pick<ErrorResponseDto, 'message' | 'error'>;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= SERVER_ERROR_MIN_STATUS) {
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    const body: ErrorResponseDto = {
      statusCode,
      ...this.getErrorDetails(exception, statusCode),
      path: httpAdapter.getRequestUrl(ctx.getRequest<unknown>()) as string,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse<unknown>(), body, statusCode);
  }

  private getErrorDetails(
    exception: unknown,
    statusCode: number,
  ): ErrorDetails {
    const defaultError = STATUS_CODES[statusCode] ?? 'Error';

    if (!(exception instanceof HttpException)) {
      return { message: INTERNAL_SERVER_ERROR_MESSAGE, error: defaultError };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response, error: defaultError };
    }

    const { message, error } = response as Record<string, unknown>;
    return {
      message:
        typeof message === 'string' || isStringArray(message)
          ? message
          : exception.message,
      error: typeof error === 'string' ? error : defaultError,
    };
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}
