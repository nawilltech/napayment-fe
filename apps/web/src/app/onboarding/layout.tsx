import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { computeOnboardingStatus } from "@/server/onboarding-status";
import { OnboardingStepper, type OnboardingStep } from "@/components/onboarding/stepper";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const status = await computeOnboardingStatus(session);

  const steps: OnboardingStep[] = [
    { key: "business", label: "Business details", href: "/onboarding/business", done: status.businessDetailsDone },
    { key: "kyc", label: "KYC documents", href: "/onboarding/kyc", done: status.kycSubmitted },
    { key: "team", label: "Invite your team", href: "/onboarding/team", done: status.teamInvited },
    { key: "api-keys", label: "API keys & webhooks", href: "/onboarding/api-keys", done: status.apiKeysDone && status.webhookConfigured },
    { key: "review", label: "Review & finish", href: "/onboarding/review", done: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="Nawill Pay" width={32} height={32} className="shrink-0 rounded-md" />
            <span className="truncate font-semibold text-navy-900">Nawill Pay — Activation</span>
          </div>
          <Link href="/dashboard" className="shrink-0 text-sm font-medium text-navy-500 hover:text-navy-800">
            Skip to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 md:flex-row md:gap-10">
        <OnboardingStepper steps={steps} />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
