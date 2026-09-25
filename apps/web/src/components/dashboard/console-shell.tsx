import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import type { ActivationProgress } from "./sidebar-nav";

/** Ink sidebar + paper header frame shared by the dashboard and activation (onboarding) routes. */
export function ConsoleShell({
  activation,
  banner,
  children,
}: {
  activation: ActivationProgress;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activation={activation} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader activation={activation} />
        {banner}
        <main className="flex-1 px-4 py-5 sm:px-8 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
