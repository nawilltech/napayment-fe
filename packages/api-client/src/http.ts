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

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...config.extraHeaders,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

export function toPageQuery(params?: PageParams) {
  return {
    page: params?.page,
    size: params?.size,
    term: params?.term,
  };
}
