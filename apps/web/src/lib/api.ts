"use client";

import { apiRequest, SAME_ORIGIN } from "@napayment/api-client";

/**
 * Calls this app's own /api/* Route Handlers (never the Java backend directly
 * - doc F2 ADR-FE-2). Failures throw @napayment/api-client's ApiError.
 */
export const api = {
  get: <T>(path: string) => apiRequest<T>(SAME_ORIGIN, path),
  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    apiRequest<T>(SAME_ORIGIN, path, { method: "POST", body, idempotencyKey }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(SAME_ORIGIN, path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(SAME_ORIGIN, path, { method: "DELETE" }),
};
