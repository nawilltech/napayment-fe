import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, streamFile } from "@napayment/bff/route-helpers";

/** Reviewer download of any business's KYC document (backend enforces platform-kyc:review). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return streamFile(await (await authedBackendClient()).admin.downloadKycDocument(id));
  } catch (error) {
    return handleRouteError(error);
  }
}
