import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, ErrorCode } from "@napayment/api-client";
import { Badge } from "@napayment/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import {
  ProcessorDetailsForm,
  ProcessorForAllSwitch,
  ProcessorLogoEditor,
  ProcessorMethodsEditor,
  ProcessorPlatformSwitch,
} from "@/components/processor-admin";
import { LogoTile } from "@/components/processor-logo";
import { ROUTES } from "@/lib/routes";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment processor — Configuration — Napayment Admin" };

export default async function PaymentProcessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await authedBackendClient();
  const [processor, allMethods] = await Promise.all([
    client.admin.paymentProcessors.get(id).catch((error) => {
      if (error instanceof ApiError && error.is(ErrorCode.PAYMENT_PROCESSOR_NOT_FOUND)) notFound();
      throw error;
    }),
    client.admin.paymentMethods.list(),
  ]);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={ROUTES.paymentProcessors} className="text-[13px] font-semibold text-link hover:text-ink">
            ← Payment processors
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <LogoTile name={processor.name} logo={processor.logo} size={40} />
            <div>
              <h2 className="text-xl font-bold text-ink">{processor.name}</h2>
              <p className="font-mono text-[12px] text-subtle">{processor.code}</p>
            </div>
          </div>
        </div>
        <Badge variant={processor.status === "ACTIVE" ? "success" : "neutral"}>
          {processor.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProcessorLogoEditor processor={processor} />
            <ProcessorDetailsForm processor={processor} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>A disabled method keeps its history but can&apos;t take new payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProcessorMethodsEditor processor={processor} allMethods={allMethods} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All businesses</CardTitle>
            <CardDescription>
              Sets the default and clears every business&apos;s own setting. To change one business, open it from
              Businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProcessorForAllSwitch processor={processor} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>The master switch for this processor.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProcessorPlatformSwitch processor={processor} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
