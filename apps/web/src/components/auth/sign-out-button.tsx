"use client";

import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@napayment/ui/button";
import { useLogout } from "@/hooks/use-auth";

export function SignOutButton(props: Omit<ButtonProps, "onClick" | "loading">) {
  const logout = useLogout();
  return (
    <Button {...props} onClick={() => logout.mutate()} loading={logout.isPending}>
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
