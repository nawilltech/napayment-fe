"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";
import {
  KYC_DOCUMENT_LABELS,
  KYC_DOCUMENT_TYPES,
  ownerIdentitySchema,
  type KycDocumentType,
  type OwnerIdentityInput,
} from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  useKycDocuments,
  useOwnerIdentity,
  useSaveOwnerIdentity,
  useSubmitKyc,
  useUploadKycDocument,
} from "@/hooks/use-onboarding";

export function KycForm() {
  const router = useRouter();
  const { data: ownerIdentity } = useOwnerIdentity();
  const saveIdentity = useSaveOwnerIdentity();
  const { data: documents } = useKycDocuments();
  const upload = useUploadKycDocument();
  const submit = useSubmitKyc();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerIdentityInput>({
    resolver: zodResolver(ownerIdentitySchema),
    values: ownerIdentity
      ? { bvn: ownerIdentity.bvn ?? "", nin: ownerIdentity.nin ?? "" }
      : undefined,
  });

  const allDocumentsUploaded = KYC_DOCUMENT_TYPES.every((type) =>
    documents?.some((doc) => doc.type === type),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Owner identity</CardTitle>
            <CardDescription>
              Verify the business owner&apos;s identity with a BVN or NIN.
            </CardDescription>
          </div>
          {ownerIdentity && <StatusBadge status={ownerIdentity.verified ? "VERIFIED" : "PENDING_REVIEW"} />}
        </CardHeader>
        <form onSubmit={handleSubmit((values) => saveIdentity.mutate(values))}>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bvn">BVN</Label>
              <Input id="bvn" maxLength={11} placeholder="11 digits" {...register("bvn")} />
            </div>
            <div>
              <Label htmlFor="nin">NIN</Label>
              <Input id="nin" maxLength={11} placeholder="11 digits" {...register("nin")} />
            </div>
            {errors.bvn && <p className="col-span-2 text-xs text-danger">{errors.bvn.message}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" variant="outline" loading={saveIdentity.isPending}>
              Save identity
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business documents</CardTitle>
          <CardDescription>Accepted formats: PDF, PNG, JPEG. Max 10MB each.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {KYC_DOCUMENT_TYPES.map((type) => {
            const uploaded = documents?.find((doc) => doc.type === type);
            return (
              <div key={type} className="space-y-1.5">
                <FileDropzone
                  label={KYC_DOCUMENT_LABELS[type]}
                  uploaded={uploaded}
                  onSelect={(file) => upload.mutate({ type: type as KycDocumentType, file })}
                />
                {uploaded && (
                  <a
                    href={`/api/onboarding/kyc/documents/${uploaded.id}/download`}
                    className="flex items-center gap-1 text-xs font-medium text-navy-600 hover:underline"
                  >
                    <Download className="size-3" />
                    Download
                  </a>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="justify-between">
          <p className="mr-auto text-xs text-navy-500">
            {documents?.length ?? 0} of {KYC_DOCUMENT_TYPES.length} documents uploaded
          </p>
          <Button
            onClick={() =>
              submit.mutate(undefined, { onSuccess: () => router.push("/onboarding/team") })
            }
            disabled={!allDocumentsUploaded}
            loading={submit.isPending}
          >
            Submit for review & continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
