import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, ValidationError } from "@napayment/bff/route-helpers";
import { VALIDATION_MESSAGES } from "@napayment/schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    if (!identifier) {
      throw new ValidationError([VALIDATION_MESSAGES.recipientRequired]);
    }
    const client = await authedBackendClient();
    const result = await client.transfers.resolve(identifier);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
