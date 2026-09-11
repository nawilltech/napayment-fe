import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/server/session";
import { computeOnboardingStatus } from "@/server/onboarding-status";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const status = await computeOnboardingStatus();
  const activationDone = status.businessDetailsDone && status.kycSubmitted && status.apiKeysDone;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <DashboardHeader />
        {!activationDone && (
          <div className="flex flex-col items-start gap-1 bg-warning-surface px-4 py-2.5 text-sm text-warning sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Finish activating your business to unlock full access.</span>
            <Link href="/onboarding" className="font-semibold underline">
              Continue activation
            </Link>
          </div>
        )}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
