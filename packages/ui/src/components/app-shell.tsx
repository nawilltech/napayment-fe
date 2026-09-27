"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { initials } from "@napayment/format";
import { cn } from "../lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Logo } from "./logo";

export interface NavItem {
  href: string;
  label: string;
  /** Active for any path under this prefix (default: exact href match). */
  matchPrefix?: string;
  /** Small mono tag on the right, e.g. "3/5". */
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Page heading by route. Most specific prefix first; `short` replaces `title` on phones. */
export interface ShellTitle {
  prefix: string;
  title: string;
  short?: string;
}

export interface ShellMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AppShellProps {
  nav: NavGroup[];
  titles: ShellTitle[];
  /** Card under the logo: who this workspace belongs to. */
  account: { name: string; caption: string } | null;
  /** Avatar menu. */
  user: { name: string; email?: string } | null;
  menuItems?: ShellMenuItem[];
  onSignOut: () => void;
  /** Right side of the header, before the avatar (e.g. a mode toggle). */
  headerActions?: ReactNode;
  /** Full-width strip under the header (e.g. an activation banner). */
  banner?: ReactNode;
  footer?: string;
  children: ReactNode;
}

/**
 * Ink sidebar + paper header frame (the "Console Sidebar" design), shared by
 * the Business Console and the admin console - each passes its own nav,
 * titles and account. Desktop gets a fixed sidebar; phones a slide-in drawer.
 */
export function AppShell({ banner, children, ...props }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col overflow-y-auto bg-ink px-3.5 py-[22px] md:flex">
        <SidebarContent {...props} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header {...props} />
        {banner}
        <main className="flex-1 px-4 py-5 sm:px-8 sm:py-7">{children}</main>
      </div>
    </div>
  );
}

type ChromeProps = Omit<AppShellProps, "banner" | "children">;

function SidebarContent({ nav, account, footer = "A Nawill product", onNavigate }: ChromeProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="px-2 pb-[22px]">
        <Logo size={32} tone="cream" wordmarkClassName="text-cream" />
      </div>
      <div className="mb-[18px] rounded-[10px] bg-ink-raised px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-cream">{account?.name ?? " "}</p>
        <p className="mt-0.5 font-mono text-[10.5px] uppercase text-ink-subtle">{account?.caption ?? " "}</p>
      </div>
      <nav className="space-y-3.5" aria-label="Main">
        {nav.map((group) => (
          <div key={group.title}>
            <p className="px-2.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-[9px] text-[13.5px] transition-colors",
                      active ? "bg-brand font-semibold text-cream" : "text-ink-fg hover:bg-ink-raised hover:text-cream",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className="font-mono text-[10px] text-ink-subtle">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex-1" />
      <p className="mt-6 border-t border-ink-line px-2.5 pt-3.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
        {footer}
      </p>
    </>
  );
}

function MobileNav(props: ChromeProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="-ml-1.5 flex size-9 items-center justify-center rounded-lg text-ink hover:bg-line-soft md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[85vw] flex-col overflow-y-auto bg-ink px-3.5 py-[22px] shadow-xl md:hidden">
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-3 top-5 flex size-8 items-center justify-center rounded-lg text-ink-fg hover:bg-ink-raised hover:text-cream">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          <SidebarContent {...props} onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Header(props: ChromeProps) {
  const { titles, user, menuItems = [], onSignOut, headerActions } = props;
  const pathname = usePathname();
  const heading = titles.find((t) => pathname.startsWith(t.prefix));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav {...props} />
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
        {headerActions}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-9 items-center justify-center rounded-full bg-sand text-[13px] font-semibold text-ink outline-none transition-shadow hover:ring-2 hover:ring-line focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Account menu"
          >
            {user && initials(user.name)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="px-2.5 py-2">
              <p className="truncate text-[13.5px] font-semibold text-ink">{user?.name ?? "Your account"}</p>
              {user?.email && <p className="truncate text-xs text-subtle">{user.email}</p>}
            </div>
            <DropdownMenuSeparator />
            {menuItems.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>
                  <Icon className="size-4 text-subtle" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
            {menuItems.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={onSignOut} className="text-danger">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
