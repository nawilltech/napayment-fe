"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

function StepBadge({ done, active, index }: { done: boolean; active: boolean; index: number }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        done ? "bg-success text-white" : active ? "bg-cream-200 text-navy-800" : "bg-navy-100 text-navy-500",
      )}
    >
      {done ? <Check className="size-3" /> : index + 1}
    </span>
  );
}

export function OnboardingStepper({ steps }: { steps: OnboardingStep[] }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden w-56 shrink-0 md:block">
        <ol className="space-y-1">
          {steps.map((step, index) => {
            const active = pathname === step.href;
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-navy-700 text-cream-50" : "text-navy-600 hover:bg-navy-50",
                  )}
                >
                  <StepBadge done={step.done} active={active} index={index} />
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: compact horizontal scroller */}
      <nav className="-mx-4 overflow-x-auto px-4 pb-1 md:hidden">
        <ol className="flex min-w-max gap-2">
          {steps.map((step, index) => {
            const active = pathname === step.href;
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-navy-700 bg-navy-700 text-cream-50"
                      : "border-border bg-surface text-navy-600",
                  )}
                >
                  <StepBadge done={step.done} active={active} index={index} />
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
