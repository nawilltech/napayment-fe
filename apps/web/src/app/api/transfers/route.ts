import { NextResponse } from "next/server";
import { transferSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, transferSchema);
    const client = await authedBackendClient();
    // The browser generates and keeps this key stable across retries of the
    // *same* submit (see use-transfer.ts) - a fresh key here on every
    // request would defeat the point: a lost response on a flaky connection
    // must be able to safely retry without risking a second real transfer.
    // Falling back to a locally-generated one only protects a caller that
    // forgot to send it, not real retry-safety.
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? crypto.randomUUID();
    const result = await client.transfers.create(body, idempotencyKey);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
