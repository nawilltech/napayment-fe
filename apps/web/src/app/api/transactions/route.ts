import { NextResponse } from "next/server";
import type { TransactionFilter, TransactionStatus, TransactionType } from "@napayment/api-client";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function GET(request: Request) {
  try {
    const client = await authedBackendClient();
    const { searchParams } = new URL(request.url);

    const filter: TransactionFilter = {
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      status: (searchParams.get("status") as TransactionStatus) ?? undefined,
      type: (searchParams.get("type") as TransactionType) ?? undefined,
      term: searchParams.get("term") ?? undefined,
      virtualAccountId: searchParams.get("virtualAccountId") ?? undefined,
      minAmount: searchParams.get("minAmount") ?? undefined,
      maxAmount: searchParams.get("maxAmount") ?? undefined,
    };

    const result = await client.transactions.list(filter, {
      page: Number(searchParams.get("page") ?? 0),
      size: Number(searchParams.get("size") ?? 20),
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
