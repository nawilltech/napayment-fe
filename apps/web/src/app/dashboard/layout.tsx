import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loadConsole } from "@/server/console";
import { ConsoleShell } from "@/components/dashboard/console-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { activation } = await loadConsole();

  return (
    <ConsoleShell
      activation={activation}
      banner={
        activation &&
        !activation.complete && (
          <div className="flex flex-col items-start gap-1 border-b border-warning-line bg-warning-surface px-4 py-2.5 text-[13.5px] text-warning-ink sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>Finish activating your business to unlock live payouts.</span>
            <Link href="/onboarding" className="inline-flex items-center gap-1 font-semibold hover:underline">
              Continue activation
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )
      }
    >
      {children}
    </ConsoleShell>
  );
}
