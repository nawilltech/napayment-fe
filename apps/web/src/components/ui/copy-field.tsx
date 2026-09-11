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
    <div className={cn("flex items-center gap-2 rounded-md border border-border bg-navy-50 px-3 py-2", className)}>
      <code className={cn("flex-1 truncate text-sm text-navy-800", mono && "font-mono")}>{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-navy-600 hover:bg-navy-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
