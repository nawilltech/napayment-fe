import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { KYC_DOCUMENT_TYPES } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { addKycDocument, getKyc, uploadsDirFor } from "@/server/dev-store";
import { handleRouteError } from "@/server/route-helpers";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];

/**
 * TODO(FE-Gap, doc F9): suggested backend contract -
 * `POST /api/v1/kyc/documents` (multipart/form-data: `type`, `file`),
 * `GET /api/v1/kyc/documents`. Real implementation should stream to
 * encrypted object storage (S3-compatible) rather than local disk, and scan
 * for malware before accepting. Served from the dev-store today - files land
 * under `.data/uploads/<businessId>/`, metadata in `.data/dev-store.json`.
 *
 * Response shape (200/201), array of:
 * {
 *   "id": "3fa2...uuid",
 *   "type": "CAC_CERTIFICATE",
 *   "fileName": "cac-certificate.pdf",
 *   "sizeBytes": 245678,
 *   "uploadedAt": "2026-09-11T10:00:00Z"
 * }
 * See docs/api-contracts/kyc-documents.json.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const kyc = await getKyc(session.businessId);
  const documents = kyc.documents.map((doc) => ({
    id: doc.id,
    type: doc.type,
    fileName: doc.fileName,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt,
  }));
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const form = await request.formData();
    const type = form.get("type");
    const file = form.get("file");

    if (typeof type !== "string" || !KYC_DOCUMENT_TYPES.includes(type as (typeof KYC_DOCUMENT_TYPES)[number])) {
      return NextResponse.json({ message: "Invalid or missing document type" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ message: "File must be 10MB or smaller" }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ message: "Only PDF, PNG, or JPEG files are accepted" }, { status: 400 });
    }

    const dir = uploadsDirFor(session.businessId);
    await mkdir(dir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = path.join(dir, `${type}-${Date.now()}-${safeName}`);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, bytes);

    const doc = await addKycDocument(session.businessId, {
      type: type as (typeof KYC_DOCUMENT_TYPES)[number],
      fileName: file.name,
      sizeBytes: file.size,
      storagePath,
    });

    return NextResponse.json(
      { id: doc.id, type: doc.type, fileName: doc.fileName, sizeBytes: doc.sizeBytes, uploadedAt: doc.uploadedAt },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
