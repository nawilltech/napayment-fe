"use client";

import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/hooks/use-copy";

export function CopyField({ value, mono = true, className }: { value: string; mono?: boolean; className?: string }) {
  const { copied, copy } = useCopy();

  return (
    <div className={cn("flex h-11 items-center gap-2 rounded-lg border border-line bg-paper pl-3 pr-1.5", className)}>
      <code className={cn("flex-1 truncate text-[13.5px] text-ink", mono && "font-mono")}>{value}</code>
      <button
        type="button"
        onClick={() => copy(value)}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 font-sans text-[12.5px] font-semibold text-brand hover:bg-brand-surface"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
