"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/contact", label: "Contact" },
  { href: "/dashboard/settings/team", label: "Team" },
  { href: "/dashboard/settings/api-keys", label: "API Keys & Webhooks" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex w-max min-w-full gap-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 border-transparent px-1 py-3 text-sm font-medium text-navy-400 transition-colors hover:text-navy-700",
                active && "border-navy-700 text-navy-900",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
