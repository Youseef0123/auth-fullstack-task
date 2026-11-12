/** Error body returned by the backend's global exception filter. */
export interface BackendErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

export const UNEXPECTED_ERROR_MESSAGE =
  'Something went wrong. Please try again.';

/**
 * Every failed request through `http` rejects with this error.
 * statusCode is 0 when the server could not be reached; `message` is safe to
 * show to users, `messages` are the backend's raw messages (empty when none).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly messages: readonly string[];

  constructor(
    statusCode: number,
    message: string,
    messages: readonly string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
  }

  static from(error: unknown): ApiError {
    return error instanceof ApiError
      ? error
      : new ApiError(0, UNEXPECTED_ERROR_MESSAGE);
  }
}
