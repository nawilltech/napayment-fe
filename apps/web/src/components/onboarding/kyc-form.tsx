"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { DevGapNotice } from "@/components/ui/alert";
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
    values: ownerIdentity ?? undefined,
  });

  const allDocumentsUploaded = KYC_DOCUMENT_TYPES.every((type) =>
    documents?.some((doc) => doc.type === type),
  );

  return (
    <div className="space-y-6">
      <DevGapNotice>
        the backend has no KYC entity/endpoint yet (flagged `TODO(FR-8)` in its own README) — this
        step saves to a local dev-store so the flow is fully clickable. See{" "}
        <code>docs/api-contracts/kyc-*.json</code> for the suggested contract.
      </DevGapNotice>

      <Card>
        <CardHeader>
          <CardTitle>Owner identity</CardTitle>
          <CardDescription>
            FR-8: BVN or NIN verification for the business owner. In production this triggers a
            real third-party verification call, not just storage.
          </CardDescription>
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
              <FileDropzone
                key={type}
                label={KYC_DOCUMENT_LABELS[type]}
                uploaded={uploaded}
                onSelect={(file) => upload.mutate({ type: type as KycDocumentType, file })}
              />
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
