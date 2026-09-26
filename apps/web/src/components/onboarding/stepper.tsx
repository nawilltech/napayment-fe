"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollActiveIntoView } from "@/hooks/use-scroll-active-into-view";

export interface OnboardingStep {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

function StepBadge({ done, active, index, size }: { done: boolean; active: boolean; index: number; size: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-mono font-semibold",
        size === "md" ? "size-[26px] text-xs" : "size-5 text-[10.5px]",
        done ? "bg-success text-white" : active ? "bg-brand text-white" : "bg-line-soft text-subtle",
      )}
    >
      {done ? <Check className={size === "md" ? "size-3.5" : "size-3"} strokeWidth={3} /> : index + 1}
    </span>
  );
}

function stateLabel(done: boolean, active: boolean) {
  if (done) return "Done";
  return active ? "In progress" : "Not started";
}

export function OnboardingStepper({ steps }: { steps: OnboardingStep[] }) {
  const pathname = usePathname();
  const chipsRef = useScrollActiveIntoView<HTMLElement>(pathname);

  return (
    <>
      {/* Desktop: vertical step list */}
      <nav className="hidden w-60 shrink-0 md:block" aria-label="Activation steps">
        <ol className="space-y-1">
          {steps.map((step, index) => {
            const active = pathname === step.href;
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    active ? "bg-surface shadow-[0_1px_2px_rgba(32,38,74,0.08)]" : "hover:bg-paper",
                  )}
                >
                  <StepBadge done={step.done} active={active} index={index} size="md" />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">{step.label}</span>
                    <span className="block text-[11.5px] text-subtle">{stateLabel(step.done, active)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: compact horizontal scroller */}
      <nav ref={chipsRef} className="scroll-fade-x -mx-4 overflow-x-auto px-4 pb-1 md:hidden" aria-label="Activation steps">
        <ol className="flex min-w-max gap-2 pr-8">
          {steps.map((step, index) => {
            const active = pathname === step.href;
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active ? "border-brand bg-surface text-ink" : "border-line bg-paper text-muted",
                  )}
                >
                  <StepBadge done={step.done} active={active} index={index} size="sm" />
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
