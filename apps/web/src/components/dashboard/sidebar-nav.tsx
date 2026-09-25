"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface ActivationProgress {
  done: number;
  total: number;
  complete: boolean;
}

interface NavItem {
  href: string;
  label: string;
  matchPrefix?: string;
  tag?: "activation";
}

// Grouped as in the "Console Sidebar" design. Payment links, one-time accounts
// and settlements slot into COLLECT / MONEY OUT once their routes exist.
const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Home" },
      { href: "/dashboard/transactions", label: "Transactions" },
    ],
  },
  {
    title: "Money out",
    items: [{ href: "/dashboard/send", label: "Send money" }],
  },
  {
    title: "Account",
    items: [
      { href: "/onboarding", label: "Activation", matchPrefix: "/onboarding", tag: "activation" },
      { href: "/dashboard/settings/profile", label: "Settings", matchPrefix: "/dashboard/settings" },
    ],
  },
];

export function SidebarNav({
  activation,
  onNavigate,
}: {
  activation?: ActivationProgress;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-3.5" aria-label="Main">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.href;
              const tag =
                item.tag === "activation" && activation && !activation.complete
                  ? `${activation.done}/${activation.total}`
                  : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-[9px] text-[13.5px] transition-colors",
                    active
                      ? "bg-brand font-semibold text-cream"
                      : "text-ink-fg hover:bg-ink-raised hover:text-cream",
                  )}
                >
                  <span>{item.label}</span>
                  {tag && <span className="font-mono text-[10px] text-ink-subtle">{tag}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
