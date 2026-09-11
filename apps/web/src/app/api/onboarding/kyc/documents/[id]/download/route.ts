import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

/** Streams the backend's binary response straight through - never buffers the whole file in memory. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await authedBackendClient();
    const upstream = await client.kyc.downloadDocument(id);

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "attachment",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
