import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Error as MongooseError } from 'mongoose';
import { STATUS_CODES } from 'node:http';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorResponseDto } from './error-response.dto';

const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';
const SERVER_ERROR_MIN_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;
const CLIENT_ERROR_MIN_STATUS: number = HttpStatus.BAD_REQUEST;

type ErrorDetails = Pick<ErrorResponseDto, 'statusCode' | 'message' | 'error'>;

/** Shape of errors from body-parser and other http-errors based middleware. */
interface ExposedHttpError {
  status: number;
  expose: true;
  message: string;
}

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
    const details = getErrorDetails(exception);

    if (details.statusCode >= SERVER_ERROR_MIN_STATUS) {
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    const body: ErrorResponseDto = {
      ...details,
      path: httpAdapter.getRequestUrl(ctx.getRequest<unknown>()) as string,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse<unknown>(), body, details.statusCode);
  }
}

function getErrorDetails(exception: unknown): ErrorDetails {
  if (exception instanceof HttpException) {
    return fromHttpException(exception);
  }
  // Backstop: the DTOs validate first, so a schema-level failure is still the client's input.
  if (exception instanceof MongooseError.ValidationError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: Object.values(exception.errors).map((error) => error.message),
      error: statusText(HttpStatus.BAD_REQUEST),
    };
  }
  // e.g. body-parser's 413 "request entity too large" or 415 errors.
  if (isExposedClientError(exception)) {
    return {
      statusCode: exception.status,
      message: exception.message,
      error: statusText(exception.status),
    };
  }
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: INTERNAL_SERVER_ERROR_MESSAGE,
    error: statusText(HttpStatus.INTERNAL_SERVER_ERROR),
  };
}

function fromHttpException(exception: HttpException): ErrorDetails {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { statusCode, message: response, error: statusText(statusCode) };
  }

  const { message, error } = response as Record<string, unknown>;
  return {
    statusCode,
    message:
      typeof message === 'string' || isStringArray(message)
        ? message
        : exception.message,
    error: typeof error === 'string' ? error : statusText(statusCode),
  };
}

function isExposedClientError(value: unknown): value is ExposedHttpError {
  if (!(value instanceof Error)) {
    return false;
  }
  const { status, expose } = value as Partial<ExposedHttpError>;
  return (
    expose === true &&
    typeof status === 'number' &&
    status >= CLIENT_ERROR_MIN_STATUS &&
    status < SERVER_ERROR_MIN_STATUS
  );
}

function statusText(statusCode: number): string {
  return STATUS_CODES[statusCode] ?? 'Error';
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}
