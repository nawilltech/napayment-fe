import "server-only";
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

/** An unauthenticated client, for public endpoints (signup, login, forgot-password, ...). */
export function publicBackendClient(): BackendClient {
  return createBackendClient({ baseUrl: baseUrl() });
}

/** An authenticated client using the current request's session cookie. Throws if there's no session. */
export async function authedBackendClient(): Promise<BackendClient> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return createBackendClient({ baseUrl: baseUrl(), accessToken: session.accessToken });
}
