"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyField({ value, mono = true, className }: { value: string; mono?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={cn("flex h-11 items-center gap-2 rounded-lg border border-line bg-paper pl-3 pr-1.5", className)}>
      <code className={cn("flex-1 truncate text-[13.5px] text-ink", mono && "font-mono")}>{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 font-sans text-[12.5px] font-semibold text-brand hover:bg-brand-surface"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
