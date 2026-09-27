import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, ErrorCode } from "@napayment/api-client";
import { Badge } from "@napayment/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import {
  DeletePaymentMethodButton,
  PaymentMethodDetailsForm,
  PaymentMethodPlatformSwitch,
} from "@/components/payment-method-admin";
import { ROUTES } from "@/lib/routes";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment method — Configuration — Napayment Admin" };

export default async function PaymentMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await (await authedBackendClient()).admin.paymentMethods.get(id).catch((error) => {
    if (error instanceof ApiError && error.is(ErrorCode.PAYMENT_METHOD_NOT_FOUND)) notFound();
    throw error;
  });

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={ROUTES.paymentMethods} className="text-[13px] font-semibold text-link hover:text-ink">
            ← Payment methods
          </Link>
          <h2 className="mt-1 text-xl font-bold text-ink">{method.name}</h2>
          <p className="font-mono text-[12px] text-subtle">{method.code}</p>
        </div>
        <Badge variant={method.status === "ACTIVE" ? "success" : "neutral"}>
          {method.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodDetailsForm method={method} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>The master switch for this payment method.</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodPlatformSwitch method={method} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <DeletePaymentMethodButton method={method} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
