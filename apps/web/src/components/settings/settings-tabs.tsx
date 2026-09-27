"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@napayment/ui/icon";
import { cn } from "@napayment/ui/lib/cn";
import type { IconName } from "@napayment/ui-tokens";
import { useScrollActiveIntoView } from "@napayment/ui/lib/use-scroll-active-into-view";

// businessOnly tabs call endpoints the backend rejects for accounts without a business.
const TABS: { href: string; label: string; icon: IconName; businessOnly?: boolean }[] = [
  { href: "/dashboard/settings/profile", label: "Profile", icon: "profile" },
  { href: "/dashboard/settings/contact", label: "Contact", icon: "contact", businessOnly: true },
  { href: "/dashboard/settings/team", label: "Team", icon: "team", businessOnly: true },
  { href: "/dashboard/settings/api-keys", label: "API keys & webhooks", icon: "apiKeys", businessOnly: true },
  { href: "/dashboard/settings/security", label: "Security", icon: "security" },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: "preferences" },
];

export function SettingsTabs({ business }: { business: boolean }) {
  const pathname = usePathname();
  const rowRef = useScrollActiveIntoView<HTMLDivElement>(pathname);
  return (
    <div ref={rowRef} className="scroll-fade-x overflow-x-auto sm:[mask-image:none]">
      <nav className="flex w-max min-w-full gap-5 pr-8 sm:gap-[26px] sm:pr-0" aria-label="Settings">
        {TABS.filter((tab) => business || !tab.businessOnly).map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent pb-3 pt-3.5 text-[13.5px] text-subtle transition-colors hover:text-ink",
                active && "border-brand font-semibold text-ink",
              )}
            >
              <Icon name={tab.icon} className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
