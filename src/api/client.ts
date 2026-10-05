export const API_BASE_URL: string = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';
// A mutation that takes longer than this is given up; its result on the server is unknown then.
export const MUTATION_TIMEOUT_MS: number = 15_000;

const NETWORK_ERROR_MESSAGE: string =
  'Could not reach the server. Check your connection and try again.';
const TIMEOUT_MESSAGE: string = 'The server did not answer in time.';
const GATEWAY_TIMEOUT_STATUS: number = 504;

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

  /**
   * The request may or may not have reached the server (lost connection, timeout), so a mutation
   * may already be applied. Such requests are never repeated automatically.
   */
  get isOutcomeUnknown(): boolean {
    return this.status === 0 || this.status === GATEWAY_TIMEOUT_STATUS;
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

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const body: unknown = await response.json();

  return body as T;
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

    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  return readJson(response);
}

/**
 * Sends a JSON POST request (a mutation) and returns the parsed JSON body. A lost connection or a
 * request that runs longer than `MUTATION_TIMEOUT_MS` rejects with an error whose
 * `isOutcomeUnknown` is `true`; the caller must not repeat it automatically.
 */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller: AbortController = new AbortController();
  const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
    controller.abort();
  }, MUTATION_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error: unknown) {
    throw new ApiError(0, isAbortError(error) ? TIMEOUT_MESSAGE : NETWORK_ERROR_MESSAGE);
  } finally {
    clearTimeout(timer);
  }

  return readJson(response);
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
