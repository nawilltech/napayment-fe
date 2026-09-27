import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@napayment/bff/route-helpers";

/** Name Enquiry preview: GET /api/banks/resolve-account?bankId=…&accountNumber=… */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await (await authedBackendClient()).bankAccounts.resolve(
      searchParams.get("bankId") ?? "",
      searchParams.get("accountNumber") ?? "",
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
