"use client";

import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "./mobile-sidebar";
import { ModeToggle } from "./mode-toggle";
import type { ActivationProgress } from "./sidebar-nav";
import { useLogout, useMe } from "@/hooks/use-auth";
import { initials } from "@napayment/format";

// Most specific prefix first. `short` replaces `title` on phones.
const TITLES: { prefix: string; title: string; short?: string }[] = [
  { prefix: "/dashboard/transactions", title: "Transactions" },
  { prefix: "/dashboard/send", title: "Send money" },
  { prefix: "/dashboard/settings", title: "Settings" },
  { prefix: "/onboarding", title: "Activate your business", short: "Activation" },
  { prefix: "/dashboard", title: "Home" },
];

export function DashboardHeader({ activation }: { activation?: ActivationProgress }) {
  const pathname = usePathname();
  const heading = TITLES.find((t) => pathname.startsWith(t.prefix));
  const { data: me } = useMe();
  const logout = useLogout();

  const personName = me ? `${me.firstName} ${me.lastName}` : "Your account";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <MobileSidebar activation={activation} />
        <h1 className="truncate text-lg font-bold text-ink">
          {heading?.short ? (
            <>
              <span className="sm:hidden">{heading.short}</span>
              <span className="hidden sm:inline">{heading.title}</span>
            </>
          ) : (
            heading?.title
          )}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-9 items-center justify-center rounded-full bg-sand text-[13px] font-semibold text-ink outline-none transition-shadow hover:ring-2 hover:ring-line focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Account menu"
          >
            {me && initials(personName)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-2.5 py-2">
              <p className="truncate text-[13.5px] font-semibold text-ink">{personName}</p>
              {me?.email && <p className="truncate text-xs text-subtle">{me.email}</p>}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings/profile">
                <Settings className="size-4 text-subtle" />
                Profile settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout.mutate()} className="text-danger">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
