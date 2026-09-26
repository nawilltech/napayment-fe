"use client";

import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/hooks/use-copy";

/** Inline text-link style copy action ("Copy account details" on Home). */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const { copied, copy } = useCopy();

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-ink", className)}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
