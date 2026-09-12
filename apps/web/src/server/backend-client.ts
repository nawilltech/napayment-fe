import "server-only";
import { headers } from "next/headers";
import { createBackendClient, type BackendClient } from "@napayment/api-client";
import { getSession } from "./session";

function baseUrl(): string {
  const url = process.env.NAWILL_API_BASE_URL;
  if (!url) {
    throw new Error(
      "NAWILL_API_BASE_URL is not set - see .env.example. The Java backend must be reachable server-side for every endpoint this app calls.",
    );
  }
  return url;
}

/**
 * The X-Request-Id middleware.ts stamped on this same incoming request -
 * forwarded to the Java backend so its own logs (RequestIdFilter, MDC) use
 * the identical id rather than minting an unrelated one, giving one
 * correlation id across the browser, this app's logs, and the backend's.
 */
async function correlationHeaders(): Promise<Record<string, string>> {
  const requestId = (await headers()).get("x-request-id");
  return requestId ? { "X-Request-Id": requestId } : {};
}

/** An unauthenticated client, for public endpoints (signup, login, forgot-password, ...). */
export async function publicBackendClient(): Promise<BackendClient> {
  return createBackendClient({ baseUrl: baseUrl(), extraHeaders: await correlationHeaders() });
}

/** An authenticated client using the current request's session cookie. Throws if there's no session. */
export async function authedBackendClient(): Promise<BackendClient> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return createBackendClient({
    baseUrl: baseUrl(),
    accessToken: session.accessToken,
    extraHeaders: await correlationHeaders(),
  });
}
