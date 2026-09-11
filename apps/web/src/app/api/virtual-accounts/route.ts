import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.virtualAccounts.listMine({ page: 0, size: 5 });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
