"use client";

import { useTransition } from "react";
import { AppShell, type NavGroup, type ShellTitle } from "@napayment/ui/app-shell";
import { signOutAction } from "@/app/actions";
import { ROUTES } from "@/lib/routes";

const TITLES: ShellTitle[] = [
  { prefix: "/overview", title: "Overview" },
  { prefix: "/kyc", title: "KYC review queue", short: "KYC review" },
  { prefix: "/businesses", title: "Businesses" },
  { prefix: "/transactions", title: "Platform transactions", short: "Transactions" },
  { prefix: ROUTES.paymentProcessors, title: "Configuration · Payment processors", short: "Processors" },
  { prefix: ROUTES.paymentMethods, title: "Configuration · Payment methods", short: "Payment methods" },
  { prefix: ROUTES.collectionAccount, title: "Configuration · Collection account", short: "Collection account" },
  { prefix: "/audit-logs", title: "Audit logs" },
  { prefix: "/settings", title: "Settings" },
];

function adminNav(pendingKyc: number): NavGroup[] {
  return [
    { title: "Overview", items: [{ href: "/overview", label: "Overview", icon: "overview" }] },
    {
      title: "Businesses",
      items: [
        { href: "/kyc", label: "KYC review", icon: "kycReview", matchPrefix: "/kyc", badge: pendingKyc > 0 ? String(pendingKyc) : undefined },
        { href: "/businesses", label: "All businesses", icon: "businesses", matchPrefix: "/businesses" },
      ],
    },
    { title: "Money", items: [{ href: "/transactions", label: "Transactions", icon: "transactions", matchPrefix: "/transactions" }] },
    {
      title: "Configuration",
      items: [
        { href: ROUTES.paymentProcessors, label: "Payment processors", icon: "processors", matchPrefix: ROUTES.paymentProcessors },
        { href: ROUTES.paymentMethods, label: "Payment methods", icon: "paymentMethods", matchPrefix: ROUTES.paymentMethods },
        { href: ROUTES.collectionAccount, label: "Collection account", icon: "bank", matchPrefix: ROUTES.collectionAccount },
      ],
    },
    { title: "Platform", items: [{ href: "/audit-logs", label: "Audit logs", icon: "auditLogs", matchPrefix: "/audit-logs" }] },
    { title: "Account", items: [{ href: "/settings", label: "Settings", icon: "settings", matchPrefix: "/settings" }] },
  ];
}

/** The admin console's frame: the same AppShell as the Business Console, with platform nav. */
export function AdminShell({
  staff,
  pendingKyc,
  children,
}: {
  staff: { name: string; email: string; role: string };
  pendingKyc: number;
  children: React.ReactNode;
}) {
  const [, startTransition] = useTransition();
  return (
    <AppShell
      nav={adminNav(pendingKyc)}
      titles={TITLES}
      account={{ name: "Napayment platform", caption: staff.role }}
      user={{ name: staff.name, email: staff.email }}
      menuItems={[{ href: "/settings", label: "Settings", icon: "settings" }]}
      onSignOut={() => startTransition(() => signOutAction())}
      footer="Nawill staff only"
    >
      {children}
    </AppShell>
  );
}
