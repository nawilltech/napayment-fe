import type { Metadata } from "next";
import { getSession } from "@/server/session";
import { authedBackendClient } from "@/server/backend-client";
import { getProfile } from "@/server/dev-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Nawill Pay" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [profile, client] = await Promise.all([getProfile(session.userId), authedBackendClient()]);
  const virtualAccounts = await client.virtualAccounts.listMine({ size: 5 });
  const account = virtualAccounts.content[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">
          Welcome{profile ? `, ${profile.firstName}` : ""}
        </h1>
        <p className="text-sm text-navy-500">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="text-2xl">{account ? formatNaira(account.balance) : "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Virtual account number</CardDescription>
            <CardTitle className="font-mono text-lg">{account?.accountNumber ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Currency</CardDescription>
            <CardTitle className="text-2xl">{account?.currency ?? "NGN"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>
            Backend gap (doc F9): <code>TransactionController</code> only exposes create + get-by-id
            today, no list endpoint — a history table isn&apos;t buildable yet without it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-navy-500">Nothing to show until a list endpoint exists.</p>
        </CardContent>
      </Card>
    </div>
  );
}
