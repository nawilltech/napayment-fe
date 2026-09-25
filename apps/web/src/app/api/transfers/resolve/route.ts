import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, ValidationError } from "@/server/route-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    if (!identifier) {
      throw new ValidationError(["Enter an account number or phone number"]);
    }
    const client = await authedBackendClient();
    const result = await client.transfers.resolve(identifier);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
