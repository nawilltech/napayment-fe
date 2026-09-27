import type { Metadata } from "next";
import Link from "next/link";
import { plural } from "@napayment/format";
import { Badge } from "@napayment/ui/badge";
import { Table, TableCard, TableMessage, Td, Th, THead, Tr } from "@napayment/ui/table";
import { EntityActions } from "@/components/entity-actions";
import { AddPaymentMethodButton } from "@/components/payment-method-admin";
import { ROUTES } from "@/lib/routes";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment methods — Configuration — Napayment Admin" };

export default async function PaymentMethodsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const archived = (await searchParams).archived === "true";
  const methods = await (await authedBackendClient()).admin.paymentMethods.list({ archived });

  return (
    <div className="max-w-5xl space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-muted">
          {archived
            ? `${plural(methods.length, "archived payment method")} - hidden from processors and checkout.`
            : `${plural(methods.length, "payment method")}, in the order payers see them.`}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={archived ? ROUTES.paymentMethods : `${ROUTES.paymentMethods}?archived=true`}
            className="text-[13px] font-semibold text-link hover:text-ink"
          >
            {archived ? "← Back to active" : "Show archived"}
          </Link>
          {!archived && <AddPaymentMethodButton />}
        </div>
      </div>
      <TableCard>
        <Table minWidth={680}>
          <THead>
            <Th>Payment method</Th>
            <Th>Description</Th>
            <Th align="right">Order</Th>
            <Th align="right">Processors</Th>
            <Th>Platform</Th>
            <Th align="right">Actions</Th>
          </THead>
          <tbody>
            {methods.length === 0 && (
              <TableMessage colSpan={6}>
                {archived ? "No archived payment methods." : <>No payment methods yet - use &ldquo;Add payment method&rdquo; to create the first.</>}
              </TableMessage>
            )}
            {methods.map((method) => (
              <Tr key={method.id}>
                <Td>
                  <Link href={ROUTES.paymentMethod(method.id)} className="font-semibold text-ink hover:text-link">
                    {method.name}
                  </Link>
                  <span className="block font-mono text-[11.5px] text-subtle">{method.code}</span>
                </Td>
                <Td className="text-[13px] text-muted">{method.description ?? "—"}</Td>
                <Td align="right" className="font-mono">
                  {method.displayOrder}
                </Td>
                <Td align="right" className="font-mono">
                  {method.processorCount}
                </Td>
                <Td>
                  <Badge variant={method.status === "ACTIVE" ? "success" : "neutral"}>
                    {method.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td align="right">
                  <EntityActions kind="paymentMethod" item={method} variant="row" />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

    </div>
  );
}
