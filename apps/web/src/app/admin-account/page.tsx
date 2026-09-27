import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountKind } from "@napayment/bff/account";
import { getCurrentUser } from "@/server/console";
import { Logo } from "@napayment/ui/logo";
import { buttonVariants } from "@napayment/ui/button";
import { Card } from "@napayment/ui/card";
import { cn } from "@napayment/ui/lib/cn";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Admin account — Napayment" };

/**
 * Where platform staff (ADMIN / SUPERADMIN) land. The Business Console is
 * scoped to a business and the backend rejects its calls for accounts
 * without one, so staff get this page instead of a crash, pointing them at
 * the admin console (apps/admin; ADMIN_CONSOLE_URL). The two apps keep
 * separate sessions, so staff sign in there too.
 */
export default async function AdminAccountPage() {
  const me = await getCurrentUser();
  if (accountKind(me) !== "platform") redirect("/dashboard");
  const adminConsoleUrl = process.env.ADMIN_CONSOLE_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-10">
      <Logo size={36} wordmarkClassName="text-ink" />
      <Card className="w-full max-w-[440px] p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
          {me.userType === "SUPERADMIN" ? "Super admin" : "Admin"} account
        </p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight text-ink">This is a Napayment staff account</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          The Business Console is for organisations collecting payments, so it isn&apos;t available to staff
          accounts. Platform administration lives in the admin console.
        </p>
        <p className="mt-5 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-muted">
          Signed in as <span className="font-semibold text-ink">{me.email}</span>
        </p>
        {adminConsoleUrl && (
          <a href={adminConsoleUrl} className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
            Open the admin console
          </a>
        )}
        <SignOutButton variant="outline" className={cn(adminConsoleUrl ? "mt-2.5" : "mt-6", "w-full")} />
      </Card>
    </main>
  );
}
