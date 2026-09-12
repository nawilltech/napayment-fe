import { NextResponse } from "next/server";
import { ApiError } from "@napayment/api-client";
import { webhookConfigSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.apiKeys.getWebhookConfig();
    return NextResponse.json(result);
  } catch (error) {
    // 404s with "No active API key for this business" until one's been
    // generated - that's "nothing configured yet," not an error, for a
    // read. The API Keys form gates the webhook card behind an active key
    // existing, but this keeps the endpoint honest regardless of caller.
    if (error instanceof ApiError && error.status === 404) {
      return NextResponse.json({ callbackUrl: null, webhookUrl: null, updatedAt: "" });
    }
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await parseBody(request, webhookConfigSchema);
    const client = await authedBackendClient();
    const result = await client.apiKeys.updateWebhookConfig(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
