"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@napayment/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@napayment/ui/dialog";
import { Icon } from "@napayment/ui/icon";

/**
 * A "+ Add …" button that opens its create form in a dialog, so list pages
 * show only the list until an admin chooses to add something. The form
 * gets `close` to call once it has saved; closing unmounts it, so every
 * open starts with a fresh, empty form.
 */
export function CreateDialog({
  label,
  title,
  description,
  wide,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  /** For forms with several fields per row. */
  wide?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Icon name="add" className="size-4" />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={wide ? "max-w-2xl" : undefined}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {open && children(() => setOpen(false))}
        </DialogContent>
      </Dialog>
    </>
  );
}
