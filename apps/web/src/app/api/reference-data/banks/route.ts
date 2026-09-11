import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function GET(request: Request) {
  try {
    const client = await authedBackendClient();
    const { searchParams } = new URL(request.url);
    const result = await client.referenceData.listBanks({
      page: Number(searchParams.get("page") ?? 0),
      size: Number(searchParams.get("size") ?? 50),
      term: searchParams.get("term") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
