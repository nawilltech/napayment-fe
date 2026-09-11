import { NextResponse } from "next/server";
import { ipWhitelistEntrySchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET(request: Request) {
  try {
    const client = await authedBackendClient();
    const { searchParams } = new URL(request.url);
    const result = await client.apiKeys.listIpWhitelist({
      page: Number(searchParams.get("page") ?? 0),
      size: Number(searchParams.get("size") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, ipWhitelistEntrySchema);
    const client = await authedBackendClient();
    await client.apiKeys.addIpWhitelist(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cidr = searchParams.get("cidr");
    if (!cidr) {
      return NextResponse.json({ message: "cidr is required" }, { status: 400 });
    }
    const client = await authedBackendClient();
    await client.apiKeys.removeIpWhitelist(cidr);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
