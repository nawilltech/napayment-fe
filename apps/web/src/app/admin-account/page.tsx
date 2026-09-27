import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountKind } from "@/lib/account";
import { getCurrentUser } from "@/server/console";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Admin account — Napayment" };

/**
 * Where platform staff (ADMIN / SUPERADMIN) land. The Business Console is
 * scoped to a business and the backend rejects its calls for accounts
 * without one, so staff get this page instead of a crash. Replaced by a
 * redirect to the admin console once apps/admin exists.
 */
export default async function AdminAccountPage() {
  const me = await getCurrentUser();
  if (accountKind(me) !== "platform") redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-4 py-10">
      <Logo size={36} wordmarkClassName="text-ink" />
      <Card className="w-full max-w-[440px] p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
          {me.userType === "SUPERADMIN" ? "Super admin" : "Admin"} account
        </p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight text-ink">This is a Napayment staff account</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          The Business Console is for organisations collecting payments, so it isn&apos;t available to staff
          accounts. Platform administration will live in the separate admin console, which is being built.
        </p>
        <p className="mt-5 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-muted">
          Signed in as <span className="font-semibold text-ink">{me.email}</span>
        </p>
        <SignOutButton variant="outline" className="mt-6 w-full" />
      </Card>
    </main>
  );
}
