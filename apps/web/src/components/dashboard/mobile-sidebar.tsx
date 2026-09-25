"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { SidebarContent } from "./sidebar-content";
import type { ActivationProgress } from "./sidebar-nav";

export function MobileSidebar({ activation }: { activation?: ActivationProgress }) {
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
          <SidebarContent activation={activation} onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
