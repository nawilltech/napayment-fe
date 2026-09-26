"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollActiveIntoView } from "@/hooks/use-scroll-active-into-view";

const TABS = [
  { href: "/dashboard/settings/profile", label: "Profile" },
  { href: "/dashboard/settings/contact", label: "Contact" },
  { href: "/dashboard/settings/team", label: "Team" },
  { href: "/dashboard/settings/api-keys", label: "API keys & webhooks" },
  { href: "/dashboard/settings/security", label: "Security" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  const rowRef = useScrollActiveIntoView<HTMLDivElement>(pathname);
  return (
    <div ref={rowRef} className="scroll-fade-x overflow-x-auto sm:[mask-image:none]">
      <nav className="flex w-max min-w-full gap-5 pr-8 sm:gap-[26px] sm:pr-0" aria-label="Settings">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 border-transparent pb-3 pt-3.5 text-[13.5px] text-subtle transition-colors hover:text-ink",
                active && "border-brand font-semibold text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
