"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "napayment_mode";

/**
 * UI only for now - no backend endpoint exists yet to actually switch which
 * environment requests hit (test vs. live processor/collection-account
 * config). Persisted to localStorage purely as a per-viewer convenience so
 * it doesn't reset on every refresh; once a real endpoint exists this
 * should read/write server state instead (see docs/nawill-pay-frontend.md
 * doc F9 for the pattern used elsewhere for a UI built ahead of its backend).
 */
export function ModeToggle() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    try {
      setIsLive(localStorage.getItem(STORAGE_KEY) === "live");
    } catch {
      // localStorage unavailable (private browsing, etc.) - default to test mode
    }
  }, []);

  function toggle() {
    const next = !isLive;
    setIsLive(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "live" : "test");
    } catch {
      // per-viewer convenience only - fine if it doesn't persist
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLive}
      onClick={toggle}
      title={isLive ? "Switch to test mode" : "Switch to live mode"}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-[5px] font-mono text-[11px] uppercase transition-colors sm:px-2.5",
        isLive
          ? "border-transparent bg-success-surface text-[#12573A] hover:border-success-line"
          : "border-transparent bg-warning-surface text-warning-ink hover:border-warning-line",
      )}
    >
      <span className={cn("size-1.5 rounded-full", isLive ? "bg-success" : "bg-warning")} aria-hidden />
      {isLive ? "Live" : "Test"}
      <span className="hidden sm:inline">mode</span>
    </button>
  );
}
