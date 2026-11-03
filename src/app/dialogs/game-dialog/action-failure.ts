import { ApiError, getErrorKey } from '@/core/api/api-error';
import type { SnackbarOptions } from '@/shared/ui/snackbar/snackbar.service';

/**
 * The Snackbar of a failed protected action. When the request may have reached the server (lost
 * connection, timeout) the user is told that the result is unknown, since it is never sent again
 * by itself; otherwise the reason is named in the language of the UI.
 */
export function describeFailure(
  error: unknown,
  failedKey: string,
  unknownKey: string,
  translate: (key: string) => string,
): SnackbarOptions {
  if (error instanceof ApiError && error.isOutcomeUnknown) {
    return { message: unknownKey, variant: 'error' };
  }

  return {
    message: failedKey,
    params: { reason: translate(getErrorKey(error)) },
    variant: 'error',
  };
}
