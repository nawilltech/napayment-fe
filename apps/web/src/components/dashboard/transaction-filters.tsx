"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { koboToNairaInput, nairaToKobo } from "@napayment/format";
import type { TransactionFilter, TransactionStatus, TransactionType } from "@napayment/api-client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES: TransactionStatus[] = ["PENDING", "PROCESSING", "PAID", "FAILED", "ON_HOLD"];
const TYPES: TransactionType[] = ["CREDIT", "DEBIT"];

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

function presetRange(days: number): { fromDate: string; toDate: string } {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);
  return { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() };
}

export function TransactionFilters({
  value,
  onChange,
}: {
  value: TransactionFilter;
  onChange: (next: TransactionFilter) => void;
}) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [term, setTerm] = useState(value.term ?? "");
  const [minAmount, setMinAmount] = useState(koboToNairaInput(value.minAmount));
  const [maxAmount, setMaxAmount] = useState(koboToNairaInput(value.maxAmount));
  const [showMore, setShowMore] = useState(false);

  function applyDraft() {
    onChange({
      ...value,
      term: term.trim() || undefined,
      minAmount: nairaToKobo(minAmount),
      maxAmount: nairaToKobo(maxAmount),
    });
  }

  function clearAll() {
    setActivePreset(null);
    setTerm("");
    setMinAmount("");
    setMaxAmount("");
    onChange({});
  }

  const compact = "h-10 text-[13.5px]";
  // Dates and amounts sit behind a toggle on phones; count what's hidden there.
  const advancedActive = [value.fromDate || value.toDate, value.minAmount || value.maxAmount].filter(Boolean).length;

  const dateInputs = (className?: string) => (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="date"
        aria-label="From date"
        className={cn(compact, "min-w-0 font-mono text-[13px] sm:w-[150px]")}
        value={value.fromDate ? value.fromDate.slice(0, 10) : ""}
        onChange={(e) => {
          setActivePreset(null);
          onChange({
            ...value,
            fromDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
          });
        }}
      />
      <span className="shrink-0 text-xs text-subtle">to</span>
      <Input
        type="date"
        aria-label="To date"
        className={cn(compact, "min-w-0 font-mono text-[13px] sm:w-[150px]")}
        value={value.toDate ? value.toDate.slice(0, 10) : ""}
        onChange={(e) => {
          setActivePreset(null);
          const end = e.target.value ? new Date(e.target.value) : undefined;
          end?.setHours(23, 59, 59, 999);
          onChange({ ...value, toDate: end ? end.toISOString() : undefined });
        }}
      />
    </div>
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input
            placeholder="Search by session ID"
            aria-label="Search by session ID"
            className={cn(compact, "pl-9")}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onBlur={applyDraft}
            onKeyDown={(e) => e.key === "Enter" && applyDraft()}
          />
        </div>
        <div className="min-w-0 flex-1 sm:w-[150px] sm:flex-none">
          <Select
            aria-label="Status"
            className={compact}
            value={value.status ?? ""}
            onChange={(e) =>
              onChange({ ...value, status: (e.target.value || undefined) as TransactionStatus | undefined })
            }
          >
            <option value="">Status: All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 flex-1 sm:w-[130px] sm:flex-none">
          <Select
            aria-label="Type"
            className={compact}
            value={value.type ?? ""}
            onChange={(e) =>
              onChange({ ...value, type: (e.target.value || undefined) as TransactionType | undefined })
            }
          >
            <option value="">Type: All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "CREDIT" ? "Credit" : "Debit"}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0 px-3 sm:hidden"
          aria-expanded={showMore}
          aria-controls="more-filters"
          onClick={() => setShowMore((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          <span className="sr-only">More filters</span>
          {advancedActive > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand font-mono text-[11px] text-cream">
              {advancedActive}
            </span>
          )}
        </Button>
        {dateInputs("hidden sm:flex")}
      </div>

      <div id="more-filters" className={cn("space-y-2.5 sm:space-y-0", !showMore && "hidden sm:block")}>
        {dateInputs("sm:hidden")}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={activePreset === preset.label}
                onClick={() => {
                  setActivePreset(preset.label);
                  onChange({ ...value, ...presetRange(preset.days) });
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  activePreset === preset.label
                    ? "border-brand bg-brand text-cream"
                    : "border-line bg-surface text-muted hover:border-tan hover:text-ink",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:ml-auto sm:flex">
            <Input
              placeholder="Min ₦"
              aria-label="Minimum amount in naira"
              type="number"
              inputMode="decimal"
              min={0}
              className="h-9 min-w-0 font-mono text-[13px] sm:h-8 sm:w-28"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              onBlur={applyDraft}
            />
            <span className="text-xs text-subtle">–</span>
            <Input
              placeholder="Max ₦"
              aria-label="Maximum amount in naira"
              type="number"
              inputMode="decimal"
              min={0}
              className="h-9 min-w-0 font-mono text-[13px] sm:h-8 sm:w-28"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              onBlur={applyDraft}
            />
            <div className="col-span-3 grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" size="sm" onClick={applyDraft}>
                Apply
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
