import axios, { isAxiosError } from 'axios';
import {
  ApiError,
  type BackendErrorBody,
  UNEXPECTED_ERROR_MESSAGE,
} from '@/lib/api-error';

const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Check your connection and try again.';
const TOO_MANY_REQUESTS_MESSAGE = 'Too many attempts, please try again later';

function isBackendErrorBody(data: unknown): data is BackendErrorBody {
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return false;
  }
  const { message } = data;
  return (
    typeof message === 'string' ||
    (Array.isArray(message) &&
      message.every((item) => typeof item === 'string'))
  );
}

function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) {
    return new ApiError(0, UNEXPECTED_ERROR_MESSAGE);
  }
  const { response } = error;
  if (!response) {
    return new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
  // A body that isn't ours means something in between (the Next proxy) failed.
  if (!isBackendErrorBody(response.data)) {
    return new ApiError(response.status, NETWORK_ERROR_MESSAGE);
  }
  const messages = [response.data.message].flat();
  if (response.status === 429) {
    return new ApiError(429, TOO_MANY_REQUESTS_MESSAGE, messages);
  }
  if (response.status >= 500) {
    return new ApiError(response.status, UNEXPECTED_ERROR_MESSAGE);
  }
  return new ApiError(
    response.status,
    messages[0] ?? UNEXPECTED_ERROR_MESSAGE,
    messages,
  );
}

/** Same-origin client: /api/* is proxied to the backend by next.config.ts. */
export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
);
