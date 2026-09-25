"use client";

/** Thin fetch wrapper for calling this app's own /api/* Route Handlers (never the Java backend directly - doc F2 ADR-FE-2). */
export class ClientApiError extends Error {
  status: number;
  details: string[];
  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const json = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ClientApiError(json?.message ?? "Request failed", response.status, json?.details ?? []);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, headers }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
