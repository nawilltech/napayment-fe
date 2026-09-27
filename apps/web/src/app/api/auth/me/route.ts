import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@napayment/bff/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const user = await client.users.me();
    return NextResponse.json(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
