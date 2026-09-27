import { CLIENT_ERROR_MESSAGES, ErrorCode, errorCodeForStatus, HTTP_STATUS } from "./errors";
import type { ErrorResponse, PageParams } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: ErrorCode;
  readonly requestId: string | null;
  readonly details: string[];

  /** `body` is undefined when the response had no parseable error body. */
  constructor(body: Partial<ErrorResponse> | undefined, status: number) {
    super(body?.message || CLIENT_ERROR_MESSAGES.unexpected);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = body?.errorCode ?? errorCodeForStatus(status);
    this.requestId = body?.requestId ?? null;
    this.details = body?.details ?? [];
  }

  is(code: ErrorCode): boolean {
    return this.errorCode === code;
  }
}

/** JSON body, or undefined for an empty/non-JSON one (e.g. a proxy's HTML error page). */
export function parseJsonBody(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  return new ApiError(parseJsonBody(await response.text()) as Partial<ErrorResponse> | undefined, response.status);
}

export interface ApiClientConfig {
  /** e.g. http://localhost:8080 - the napayment Java backend, no trailing slash. */
  baseUrl: string;
  /** Bearer JWT, when calling as an authenticated user. */
  accessToken?: string;
  /** Extra headers merged into every request (used for the HMAC-signed third-party surface). */
  extraHeaders?: Record<string, string>;
}

/** For browser code calling its own app's /api/* routes (same origin, so no base URL). */
export const SAME_ORIGIN: ApiClientConfig = { baseUrl: "" };

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Low-level typed fetch wrapper over the napayment backend, shared by the web
 * app's server-side Route Handlers (doc F2 ADR-FE-2's BFF) and, eventually,
 * the mobile app's direct-to-backend calls (doc F4). Deliberately has no
 * framework dependency (no Next.js, no React Native import) so it runs
 * unchanged in both.
 */
export async function apiRequest<TResponse>(
  config: ApiClientConfig,
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, query, idempotencyKey } = options;
  const url = `${config.baseUrl}${path}${buildQuery(query)}`;

  // FormData (multipart upload, e.g. KYC document upload) is passed through
  // untouched - fetch sets its own Content-Type with the multipart boundary,
  // which we must NOT override or the backend can't parse the parts.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...config.extraHeaders,
  };
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (!response.ok) throw await toApiError(response);
  if (response.status === HTTP_STATUS.NO_CONTENT) return undefined as TResponse;
  return parseJsonBody(await response.text()) as TResponse;
}

/**
 * For binary responses (KYC document download) - returns the raw fetch
 * Response so the caller can stream the body through rather than buffering
 * and JSON-parsing it. Throws ApiError on a non-2xx JSON error body, same as
 * apiRequest.
 */
export async function apiRequestBinary(
  config: ApiClientConfig,
  path: string,
): Promise<Response> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: config.accessToken ? { Authorization: `Bearer ${config.accessToken}` } : undefined,
  });
  if (!response.ok) throw await toApiError(response);
  return response;
}

export function toPageQuery(params?: PageParams) {
  return {
    page: params?.page,
    size: params?.size,
    term: params?.term,
  };
}
