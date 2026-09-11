"use client";

import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "./mobile-sidebar";
import { useLogout, useMe } from "@/hooks/use-auth";

export function DashboardHeader() {
  const { data: me } = useMe();
  const logout = useLogout();

  const displayName = me ? `${me.firstName} ${me.lastName}` : "Your account";
  const businessLabel = me?.businessName ?? "Individual account";

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileSidebar />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-900">{businessLabel}</p>
          <p className="text-xs text-navy-400">Test Mode</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50">
          <span className="hidden max-w-[10rem] truncate sm:inline">{displayName}</span>
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href="/dashboard/settings/profile">Profile settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => logout.mutate()} className="text-danger">
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
