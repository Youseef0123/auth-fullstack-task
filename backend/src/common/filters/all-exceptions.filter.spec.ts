import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Error as MongooseError } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ErrorResponseDto } from './error-response.dto';

const REQUEST_URL = '/api/some/path';

describe('AllExceptionsFilter', () => {
  const reply = jest.fn<void, [unknown, ErrorResponseDto, number]>();
  const logError = jest.fn();
  const host = {
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
  } as unknown as ArgumentsHost;

  const filter = new AllExceptionsFilter(
    {
      httpAdapter: { reply, getRequestUrl: () => REQUEST_URL },
    } as unknown as HttpAdapterHost,
    { error: logError } as unknown as PinoLogger,
  );

  function catchException(exception: unknown): {
    body: ErrorResponseDto;
    status: number;
  } {
    filter.catch(exception, host);
    const [, body, status] = reply.mock.calls[0];
    return { body, status };
  }

  beforeEach(() => {
    reply.mockClear();
    logError.mockClear();
  });

  it('maps a built-in HttpException to the unified error shape', () => {
    const { body, status } = catchException(
      new NotFoundException('Cannot GET /api/some/path'),
    );

    expect(status).toBe(HttpStatus.NOT_FOUND);
    expect(body).toMatchObject({
      statusCode: 404,
      message: 'Cannot GET /api/some/path',
      error: 'Not Found',
      path: REQUEST_URL,
    });
    expect(Object.keys(body).sort()).toEqual(
      ['error', 'message', 'path', 'statusCode', 'timestamp'].sort(),
    );
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps validation messages as an array', () => {
    const { body } = catchException(
      new BadRequestException(['email must be an email', 'name too short']),
    );

    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual(['email must be an email', 'name too short']);
    expect(body.error).toBe('Bad Request');
  });

  it('falls back to the HTTP status text when no error name is provided', () => {
    const { body } = catchException(new UnauthorizedException());

    expect(body).toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  });

  it('handles an HttpException created with a plain string', () => {
    const { body } = catchException(new HttpException('Slow down', 429));

    expect(body).toMatchObject({
      statusCode: 429,
      message: 'Slow down',
      error: 'Too Many Requests',
    });
  });

  it('maps a Mongoose ValidationError to 400 with its messages', () => {
    const error = new MongooseError.ValidationError();
    error.addError(
      'name',
      new MongooseError.ValidatorError({
        path: 'name',
        message: 'Path `name` is required.',
      }),
    );

    const { body, status } = catchException(error);

    expect(status).toBe(HttpStatus.BAD_REQUEST);
    expect(body).toMatchObject({
      statusCode: 400,
      message: ['Path `name` is required.'],
      error: 'Bad Request',
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps the 4xx status of an exposed middleware error (body-parser 413)', () => {
    const error = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
      type: 'entity.too.large',
    });

    const { body, status } = catchException(error);

    expect(status).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(body).toMatchObject({
      statusCode: 413,
      message: 'request entity too large',
      error: 'Payload Too Large',
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it('does not trust a status on errors that are not marked as exposable', () => {
    const error = Object.assign(new Error('internal detail'), { status: 404 });

    const { body } = catchException(error);

    expect(body).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  it('hides details of unknown errors and logs them', () => {
    const error = new Error('db password is hunter2');
    const { body, status } = catchException(error);

    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(body).not.toHaveProperty('stack');
    expect(logError).toHaveBeenCalledWith(
      { err: error },
      'Unhandled exception',
    );
  });
});
