export const API_BASE_URL: string = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';

export type QueryParameters = Readonly<Record<string, string | number | boolean | undefined>>;

/**
 * A failed API request: `status` is the HTTP status, or `0` when the server could not be reached.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export interface RequestOptions {
  query?: QueryParameters;
  /**
   * Cancels the request, e.g. when a newer request for the same section starts.
   */
  signal?: AbortSignal;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function buildUrl(path: string, query: QueryParameters = {}): URL {
  const url: URL = new URL(`${API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

// The API answers errors with `{ "error": "..." }`.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (typeof body === 'object' && body !== null && 'error' in body) {
      return String(body.error);
    }
  } catch {
    // Not a JSON body: the status text is used instead.
  }

  return response.statusText || `Request failed with status ${String(response.status)}`;
}

/**
 * Sends a GET request to the MiniGames REST API and returns the parsed JSON body.
 * Aborted requests reject with the original `AbortError` (check it with `isAbortError`).
 */
export async function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      headers: { Accept: 'application/json' },
      signal: options.signal ?? null,
    });
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const body: unknown = await response.json();

  return body as T;
}

/**
 * Keeps only the latest request of a section alive: starting a new one aborts the previous, so an
 * old response can never overwrite a newer one.
 */
export interface LatestRequest {
  next: () => AbortSignal;
  abort: () => void;
}

export function createLatestRequest(): LatestRequest {
  let controller: AbortController | undefined;

  const abort = (): void => {
    controller?.abort();
    controller = undefined;
  };

  const next = (): AbortSignal => {
    abort();
    controller = new AbortController();

    return controller.signal;
  };

  return { next, abort };
}

/**
 * A readable message for any error thrown by an API call.
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Something unexpected happened. Please try again.';
}
