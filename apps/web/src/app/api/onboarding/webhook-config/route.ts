import { NextResponse } from "next/server";
import { webhookConfigSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.apiKeys.getWebhookConfig();
    return NextResponse.json(result);
  } catch (error) {
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
