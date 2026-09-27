import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@napayment/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import { Table, TableCard, TableMessage, Td, Th, THead, Tr } from "@napayment/ui/table";
import { CreateProcessorForm, MethodChips } from "@/components/processor-admin";
import { ROUTES } from "@/lib/routes";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment processors — Configuration — Napayment Admin" };

export default async function PaymentProcessorsPage() {
  const client = await authedBackendClient();
  const [processors, methods] = await Promise.all([
    client.admin.paymentProcessors.list({ size: 100 }),
    client.admin.paymentMethods(),
  ]);

  return (
    <div className="max-w-5xl space-y-5">
      <TableCard>
        <Table minWidth={760}>
          <THead>
            <Th>Processor</Th>
            <Th>Payment methods</Th>
            <Th align="right">Priority</Th>
            <Th>Platform</Th>
            <Th>Businesses</Th>
          </THead>
          <tbody>
            {processors.content.length === 0 && <TableMessage colSpan={5}>No processors yet - add the first below.</TableMessage>}
            {processors.content.map((processor) => (
              <Tr key={processor.id}>
                <Td>
                  <Link href={ROUTES.paymentProcessor(processor.id)} className="font-semibold text-ink hover:text-link">
                    {processor.name}
                  </Link>
                  <span className="block font-mono text-[11.5px] text-subtle">{processor.code}</span>
                </Td>
                <Td>
                  <MethodChips methods={processor.methods} />
                </Td>
                <Td align="right" className="font-mono">
                  {processor.priority}
                </Td>
                <Td>
                  <Badge variant={processor.status === "ACTIVE" ? "success" : "neutral"}>
                    {processor.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td className="text-[13px] text-muted">
                  {processor.defaultEnabled ? "On for all" : "Off for all"}
                  {(processor.businessesSwitchedOn > 0 || processor.businessesSwitchedOff > 0) &&
                    ` · ${processor.businessesSwitchedOn} on, ${processor.businessesSwitchedOff} off individually`}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Add a payment processor</CardTitle>
          <CardDescription>
            Its API keys live in the deployment configuration under the processor&apos;s code - never here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateProcessorForm methods={methods} />
        </CardContent>
      </Card>
    </div>
  );
}
