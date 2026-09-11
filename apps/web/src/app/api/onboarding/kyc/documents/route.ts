import { NextResponse } from "next/server";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.kyc.listDocuments();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    // Forwarded as-is - the File part inside stays a Blob/File the backend's
    // multipart parser can read directly, no need to re-buffer it ourselves.
    const form = await request.formData();
    const client = await authedBackendClient();
    const result = await client.kyc.uploadDocument(form);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
