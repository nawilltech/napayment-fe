import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function POST() {
  try {
    const client = await authedBackendClient();
    const result = await client.apiKeys.regenerate();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
