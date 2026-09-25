import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { activationSteps, computeOnboardingStatus, isActivationDone } from "@/server/onboarding-status";
import { ConsoleShell } from "@/components/dashboard/console-shell";
import { OnboardingStepper } from "@/components/onboarding/stepper";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const status = await computeOnboardingStatus();
  const steps = activationSteps(status);

  return (
    <ConsoleShell
      activation={{ done: steps.filter((s) => s.done).length, total: steps.length, complete: isActivationDone(status) }}
    >
      <div className="flex max-w-5xl flex-col gap-5 md:flex-row md:gap-7">
        <OnboardingStepper steps={steps} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ConsoleShell>
  );
}
