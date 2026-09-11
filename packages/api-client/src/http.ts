import type { ErrorResponse, PageParams } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly requestId: string | null;
  readonly details: string[];

  constructor(body: ErrorResponse, status: number) {
    super(body.message || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = body.errorCode ?? "UNKNOWN_ERROR";
    this.requestId = body.requestId ?? null;
    this.details = body.details ?? [];
  }
}

export interface ApiClientConfig {
  /** e.g. http://localhost:8080 - the napayment Java backend, no trailing slash. */
  baseUrl: string;
  /** Bearer JWT, when calling as an authenticated user. */
  accessToken?: string;
  /** Extra headers merged into every request (used for the HMAC-signed third-party surface). */
  extraHeaders?: Record<string, string>;
}

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

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(json as ErrorResponse, response.status);
  }

  return json as TResponse;
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
  if (!response.ok) {
    const text = await response.text();
    const json = text ? JSON.parse(text) : { message: `Request failed with status ${response.status}` };
    throw new ApiError(json as ErrorResponse, response.status);
  }
  return response;
}

export function toPageQuery(params?: PageParams) {
  return {
    page: params?.page,
    size: params?.size,
    term: params?.term,
  };
}
