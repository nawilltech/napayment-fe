"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Radio } from "lucide-react";
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
        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        isLive
          ? "border-success/30 bg-success-surface text-success hover:border-success/60"
          : "border-danger/30 bg-danger-surface text-danger hover:border-danger/60",
      )}
    >
      {isLive ? <Radio className="size-3" /> : <FlaskConical className="size-3" />}
      {isLive ? "Live Mode" : "Test Mode"}
    </button>
  );
}
