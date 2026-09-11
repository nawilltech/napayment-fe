"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      {/* Date range first - presets before custom */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setActivePreset(preset.label);
              onChange({ ...value, ...presetRange(preset.days) });
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activePreset === preset.label
                ? "border-navy-700 bg-navy-700 text-cream-50"
                : "border-border bg-background text-navy-600 hover:bg-navy-50",
            )}
          >
            {preset.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Input
            type="date"
            aria-label="From date"
            className="w-36"
            value={value.fromDate ? value.fromDate.slice(0, 10) : ""}
            onChange={(e) => {
              setActivePreset(null);
              onChange({
                ...value,
                fromDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              });
            }}
          />
          <span className="text-xs text-navy-400">to</span>
          <Input
            type="date"
            aria-label="To date"
            className="w-36"
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Select
          aria-label="Status"
          value={value.status ?? ""}
          onChange={(e) =>
            onChange({ ...value, status: (e.target.value || undefined) as TransactionStatus | undefined })
          }
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Type"
          value={value.type ?? ""}
          onChange={(e) =>
            onChange({ ...value, type: (e.target.value || undefined) as TransactionType | undefined })
          }
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Input
          placeholder="Min amount (₦)"
          type="number"
          min={0}
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          onBlur={applyDraft}
        />
        <Input
          placeholder="Max amount (₦)"
          type="number"
          min={0}
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          onBlur={applyDraft}
        />
        <Input
          placeholder="Search session ID"
          className="sm:col-span-2 lg:col-span-1"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={applyDraft}
          onKeyDown={(e) => e.key === "Enter" && applyDraft()}
        />
        <div className="flex gap-2 sm:col-span-3 lg:col-span-1">
          <Button variant="outline" size="sm" className="w-full" onClick={applyDraft}>
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
