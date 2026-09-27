import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@napayment/bff/route-helpers";

/** Backs the searchable bank picker: GET /api/banks?term=zen (name or code fragment). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await (await authedBackendClient()).referenceData.listBanks({
      size: 20,
      term: searchParams.get("term") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
