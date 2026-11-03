import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

const GATEWAY_TIMEOUT_STATUS: number = 504;
const NOT_FOUND_STATUS: number = 404;
const BAD_REQUEST_STATUS: number = 400;
const SERVER_ERROR_STATUS: number = 500;

export type ApiErrorKind = 'network' | 'timeout' | 'http';

/**
 * A failed API request: `status` is the HTTP status, or `0` when the server could not be reached
 * or did not answer in time.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;

  constructor(status: number, message: string, kind: ApiErrorKind = 'http') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }

  get isNotFound(): boolean {
    return this.status === NOT_FOUND_STATUS;
  }

  get isBadRequest(): boolean {
    return this.status === BAD_REQUEST_STATUS;
  }

  /**
   * The request may or may not have reached the server (lost connection, timeout), so a mutation
   * may already be applied. Such requests are never repeated automatically.
   */
  get isOutcomeUnknown(): boolean {
    return this.kind !== 'http' || this.status === GATEWAY_TIMEOUT_STATUS;
  }
}

// The API answers errors with `{ "error": "..." }`.
function readServerMessage(error: HttpErrorResponse): string {
  const body: unknown = error.error;

  return typeof body === 'object' && body !== null && 'error' in body
    ? String(body.error)
    : `Request failed with status ${String(error.status)}`;
}

/**
 * Turns anything an API call can throw into an ApiError.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof TimeoutError) {
    return new ApiError(0, 'The server did not answer in time.', 'timeout');
  }

  if (error instanceof HttpErrorResponse) {
    return error.status === 0
      ? new ApiError(0, 'Could not reach the server.', 'network')
      : new ApiError(error.status, readServerMessage(error));
  }

  return new ApiError(0, error instanceof Error ? error.message : String(error), 'network');
}

/**
 * Translation key of a readable message for any error of an API call. The server messages are
 * English only, so the UI explains the kind of the problem in the language of the user.
 */
export function getErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'errors.unexpected';
  }

  if (error.kind === 'network') {
    return 'errors.network';
  }

  if (error.kind === 'timeout' || error.status === GATEWAY_TIMEOUT_STATUS) {
    return 'errors.timeout';
  }

  if (error.isNotFound) {
    return 'errors.notFound';
  }

  return error.status >= SERVER_ERROR_STATUS ? 'errors.server' : 'errors.request';
}
