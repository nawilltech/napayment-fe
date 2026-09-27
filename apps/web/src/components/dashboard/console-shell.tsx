"use client";

import { Settings } from "lucide-react";
import { displayName } from "@napayment/format";
import { AppShell, type NavGroup, type ShellTitle } from "@napayment/ui/app-shell";
import { ModeToggle } from "./mode-toggle";
import { useLogout, useMe } from "@/hooks/use-auth";

export interface ActivationProgress {
  done: number;
  total: number;
  complete: boolean;
}

const TITLES: ShellTitle[] = [
  { prefix: "/dashboard/transactions", title: "Transactions" },
  { prefix: "/dashboard/send", title: "Send money" },
  { prefix: "/dashboard/settings", title: "Settings" },
  { prefix: "/onboarding", title: "Activate your business", short: "Activation" },
  { prefix: "/dashboard", title: "Home" },
];

const MENU = [{ href: "/dashboard/settings/profile", label: "Profile settings", icon: Settings }];

/**
 * Grouped as in the "Console Sidebar" design. Activation only exists for
 * business accounts (`activation` is absent otherwise); its badge shows
 * progress until done. Payment links, one-time accounts and settlements slot
 * into COLLECT / MONEY OUT once their routes exist.
 */
function consoleNav(activation?: ActivationProgress): NavGroup[] {
  return [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Home" },
        { href: "/dashboard/transactions", label: "Transactions" },
      ],
    },
    { title: "Money out", items: [{ href: "/dashboard/send", label: "Send money" }] },
    {
      title: "Account",
      items: [
        ...(activation
          ? [
              {
                href: "/onboarding",
                label: "Activation",
                matchPrefix: "/onboarding",
                badge: activation.complete ? undefined : `${activation.done}/${activation.total}`,
              },
            ]
          : []),
        { href: "/dashboard/settings/profile", label: "Settings", matchPrefix: "/dashboard/settings" },
      ],
    },
  ];
}

/** The Business Console's frame: the shared AppShell with console nav, titles and account. */
export function ConsoleShell({
  activation,
  banner,
  children,
}: {
  /** Absent for accounts without a business - hides activation in the nav. */
  activation?: ActivationProgress;
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <AppShell
      nav={consoleNav(activation)}
      titles={TITLES}
      account={me ? { name: displayName(me), caption: me.businessName ? "Business" : "Individual" } : null}
      user={me ? { name: `${me.firstName} ${me.lastName}`, email: me.email } : null}
      menuItems={MENU}
      onSignOut={() => logout.mutate()}
      headerActions={<ModeToggle />}
      banner={banner}
    >
      {children}
    </AppShell>
  );
}
