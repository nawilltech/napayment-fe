import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@napayment/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import { Table, TableCard, TableMessage, Td, Th, THead, Tr } from "@napayment/ui/table";
import { CreatePaymentMethodForm } from "@/components/payment-method-admin";
import { ROUTES } from "@/lib/routes";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment methods — Configuration — Napayment Admin" };

export default async function PaymentMethodsPage() {
  const methods = await (await authedBackendClient()).admin.paymentMethods.list();

  return (
    <div className="max-w-5xl space-y-5">
      <TableCard>
        <Table minWidth={680}>
          <THead>
            <Th>Payment method</Th>
            <Th>Description</Th>
            <Th align="right">Order</Th>
            <Th align="right">Processors</Th>
            <Th>Platform</Th>
          </THead>
          <tbody>
            {methods.length === 0 && <TableMessage colSpan={5}>No payment methods yet.</TableMessage>}
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
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Add a payment method</CardTitle>
          <CardDescription>
            Once added, payment processors can offer it. Its code is permanent - processors and transactions refer to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePaymentMethodForm />
        </CardContent>
      </Card>
    </div>
  );
}
