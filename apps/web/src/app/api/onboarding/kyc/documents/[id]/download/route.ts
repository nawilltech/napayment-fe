import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, streamFile } from "@napayment/bff/route-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return streamFile(await (await authedBackendClient()).kyc.downloadDocument(id));
  } catch (error) {
    return handleRouteError(error);
  }
}
