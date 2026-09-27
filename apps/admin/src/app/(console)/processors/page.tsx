import type { Metadata } from "next";
import { Badge } from "@napayment/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import { Table, TableCard, TableMessage, Td, Th, THead, Tr } from "@napayment/ui/table";
import { CreateProcessorForm } from "@/components/create-forms";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Payment processors — Napayment Admin" };

export default async function ProcessorsPage() {
  const processors = await (await authedBackendClient()).paymentProcessors.list({ size: 100 });

  return (
    <div className="max-w-3xl space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Payment processors</CardTitle>
          <CardDescription>The rails transactions are recorded against (FR-6).</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateProcessorForm />
        </CardContent>
      </Card>
      <TableCard>
        <Table minWidth={520}>
          <THead>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th align="right">ID</Th>
          </THead>
          <tbody>
            {processors.content.length === 0 && <TableMessage colSpan={3}>No processors yet.</TableMessage>}
            {processors.content.map((processor) => (
              <Tr key={processor.id}>
                <Td className="font-semibold text-ink">{processor.name}</Td>
                <Td>
                  <Badge variant={processor.status === "ACTIVE" ? "success" : "neutral"}>{processor.status}</Badge>
                </Td>
                <Td align="right" className="font-mono text-xs text-subtle">
                  {processor.id}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
