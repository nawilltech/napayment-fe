"use client";

import { useTransition } from "react";
import { AppShell, type NavGroup, type ShellTitle } from "@napayment/ui/app-shell";
import { signOutAction } from "@/app/actions";

const TITLES: ShellTitle[] = [
  { prefix: "/overview", title: "Overview" },
  { prefix: "/kyc", title: "KYC review queue", short: "KYC review" },
  { prefix: "/businesses", title: "Businesses" },
  { prefix: "/transactions", title: "Platform transactions", short: "Transactions" },
  { prefix: "/processors", title: "Payment processors", short: "Processors" },
  { prefix: "/collection-account", title: "Collection account" },
  { prefix: "/audit-logs", title: "Audit logs" },
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
      title: "Platform",
      items: [
        { href: "/processors", label: "Payment processors", icon: "processors", matchPrefix: "/processors" },
        { href: "/collection-account", label: "Collection account", icon: "bank", matchPrefix: "/collection-account" },
        { href: "/audit-logs", label: "Audit logs", icon: "auditLogs", matchPrefix: "/audit-logs" },
      ],
    },
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
      onSignOut={() => startTransition(() => signOutAction())}
      footer="Nawill staff only"
    >
      {children}
    </AppShell>
  );
}
