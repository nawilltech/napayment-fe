import { requireBusinessAccount } from "@/server/console";
import { ConsoleShell } from "@/components/dashboard/console-shell";
import { OnboardingStepper } from "@/components/onboarding/stepper";

// Activation is a business concept - individuals are sent back to the dashboard.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { steps, activation } = await requireBusinessAccount();

  return (
    <ConsoleShell activation={activation}>
      <div className="flex max-w-5xl flex-col gap-5 md:flex-row md:gap-7">
        <OnboardingStepper steps={steps} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ConsoleShell>
  );
}
