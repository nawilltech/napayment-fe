import "server-only";
import { headers } from "next/headers";
import { createBackendClient, type BackendClient } from "@napayment/api-client";
import { backendBaseUrl, REQUEST_ID_HEADER, type Session } from "./session-cookie";
import { NotAuthenticatedError } from "./route-helpers";

/**
 * The X-Request-Id middleware stamped on this request, forwarded to the Java
 * backend so its logs (RequestIdFilter) use the same id - one correlation id
 * across the browser, this app and the backend.
 */
async function correlationHeaders(): Promise<Record<string, string>> {
  const requestId = (await headers()).get(REQUEST_ID_HEADER);
  return requestId ? { "X-Request-Id": requestId } : {};
}

export function createBackendClients(getSession: () => Promise<Session | null>) {
  return {
    /** Unauthenticated - public endpoints (login, signup, forgot-password, ...). */
    async publicBackendClient(): Promise<BackendClient> {
      return createBackendClient({ baseUrl: backendBaseUrl(), extraHeaders: await correlationHeaders() });
    },
    /** As the signed-in user. Throws NotAuthenticatedError (-> 401 via handleRouteError) without a session. */
    async authedBackendClient(): Promise<BackendClient> {
      const session = await getSession();
      if (!session) throw new NotAuthenticatedError();
      return createBackendClient({
        baseUrl: backendBaseUrl(),
        accessToken: session.accessToken,
        extraHeaders: await correlationHeaders(),
      });
    },
  };
}
