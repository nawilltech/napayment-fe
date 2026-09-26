"use client";

import { displayName } from "@napayment/format";
import { Logo } from "@/components/brand/logo";
import { useMe } from "@/hooks/use-auth";
import { SidebarNav, type ActivationProgress } from "./sidebar-nav";

/** Logo, business card, grouped nav and footer - shared by the desktop sidebar and the mobile drawer. */
export function SidebarContent({
  activation,
  onNavigate,
}: {
  activation?: ActivationProgress;
  onNavigate?: () => void;
}) {
  const { data: me } = useMe();
  const accountName = me ? displayName(me) : " ";
  const accountKind = me?.businessName ? "Business" : "Individual";

  return (
    <>
      <div className="px-2 pb-[22px]">
        <Logo size={32} tone="cream" wordmarkClassName="text-cream" />
      </div>
      <div className="mb-[18px] rounded-[10px] bg-ink-raised px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-cream">{accountName}</p>
        <p className="mt-0.5 font-mono text-[10.5px] uppercase text-ink-subtle">{me ? accountKind : " "}</p>
      </div>
      <SidebarNav activation={activation} onNavigate={onNavigate} />
      <div className="flex-1" />
      <p className="mt-6 border-t border-ink-line px-2.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        A Nawill product
      </p>
    </>
  );
}
