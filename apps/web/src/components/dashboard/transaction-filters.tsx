"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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

function toNairaInput(kobo?: string): string {
  if (!kobo) return "";
  const value = Number(kobo) / 100;
  return Number.isFinite(value) ? String(value) : "";
}

function toKobo(naira: string): string | undefined {
  if (!naira.trim()) return undefined;
  const value = Math.round(Number(naira) * 100);
  return Number.isFinite(value) ? String(value) : undefined;
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
  const [minAmount, setMinAmount] = useState(toNairaInput(value.minAmount));
  const [maxAmount, setMaxAmount] = useState(toNairaInput(value.maxAmount));

  function applyDraft() {
    onChange({
      ...value,
      term: term.trim() || undefined,
      minAmount: toKobo(minAmount),
      maxAmount: toKobo(maxAmount),
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

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1">
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
        <div className="w-[150px]">
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
        <div className="w-[130px]">
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
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            className={cn(compact, "w-[150px] font-mono text-[13px]")}
            value={value.fromDate ? value.fromDate.slice(0, 10) : ""}
            onChange={(e) => {
              setActivePreset(null);
              onChange({
                ...value,
                fromDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              });
            }}
          />
          <span className="text-xs text-subtle">to</span>
          <Input
            type="date"
            aria-label="To date"
            className={cn(compact, "w-[150px] font-mono text-[13px]")}
            value={value.toDate ? value.toDate.slice(0, 10) : ""}
            onChange={(e) => {
              setActivePreset(null);
              const end = e.target.value ? new Date(e.target.value) : undefined;
              end?.setHours(23, 59, 59, 999);
              onChange({ ...value, toDate: end ? end.toISOString() : undefined });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            placeholder="Min ₦"
            aria-label="Minimum amount in naira"
            type="number"
            min={0}
            className="h-8 w-28 font-mono text-[13px]"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            onBlur={applyDraft}
          />
          <span className="text-xs text-subtle">–</span>
          <Input
            placeholder="Max ₦"
            aria-label="Maximum amount in naira"
            type="number"
            min={0}
            className="h-8 w-28 font-mono text-[13px]"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            onBlur={applyDraft}
          />
          <Button variant="outline" size="sm" onClick={applyDraft}>
            Apply
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
