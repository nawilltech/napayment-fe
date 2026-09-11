import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await authedBackendClient();
    const result = await client.team.revokeInvite(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
