import { NextResponse } from "next/server";
import { webhookConfigSchema } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { getWebhookConfig, saveWebhookConfig } from "@/server/dev-store";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): the ApiKeyCredential entity has no callback/webhook
 * URL column today (confirmed against ApiKeyController/ApiKeyService) even
 * though FR-9 calls for one ("...configure a webhook URL and register for
 * the webhook API"). Suggested contract: add `callbackUrl`/`webhookUrl` to
 * `ApiKeyCredential` (migration) and expose `PUT /api/v1/api-keys/webhook-config`.
 * Served from the dev-store today, keyed by businessId (not by key id, since
 * the backend only allows one active key pair per business anyway).
 *
 * Request/Response: { "callbackUrl": "https://example.com/callback", "webhookUrl": "https://example.com/webhooks/nawill" }
 * See docs/api-contracts/webhook-config.json.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const config = await getWebhookConfig(session.businessId);
  return NextResponse.json(config ?? { callbackUrl: "", webhookUrl: "" });
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const body = await parseBody(request, webhookConfigSchema);
    await saveWebhookConfig(session.businessId, body);
    return NextResponse.json({ ...body, updatedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error);
  }
}
