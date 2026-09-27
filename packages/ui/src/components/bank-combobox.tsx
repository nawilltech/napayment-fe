"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { BankResponse } from "@napayment/api-client";
import { cn } from "../lib/cn";

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Searchable bank picker backed by GET /api/v1/banks?term= (matches name or
 * code), so the full ~270-bank list is never shipped to the browser. The
 * caller supplies `search` because each app reaches the backend through its
 * own BFF route. Works in a native <form> (server actions) via the hidden
 * input carrying `name`, or controlled via `onChange`.
 */
export function BankCombobox({
  search,
  name,
  id,
  onChange,
  placeholder = "Search by bank name or code",
  disabled,
  required,
}: {
  search: (term: string) => Promise<BankResponse[]>;
  name?: string;
  id?: string;
  onChange?: (bank: BankResponse | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const listboxId = `${generatedId}-listbox`;

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BankResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<BankResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const latestRequest = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);

  // While a bank is selected the input shows its name; searching resumes on the next keystroke.
  const term = selected ? "" : query.trim();

  useEffect(() => {
    if (!open) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    const timer = setTimeout(() => {
      search(term)
        .then((banks) => {
          if (requestId !== latestRequest.current) return;
          setResults(banks);
          setFailed(false);
          setActiveIndex(banks.length > 0 ? 0 : -1);
        })
        .catch(() => {
          if (requestId === latestRequest.current) setFailed(true);
        })
        .finally(() => {
          if (requestId === latestRequest.current) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, term, search]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function choose(bank: BankResponse) {
    setSelected(bank);
    setQuery(bank.name);
    setOpen(false);
    onChange?.(bank);
  }

  function typed(value: string) {
    setQuery(value);
    setOpen(true);
    if (selected) {
      setSelected(null);
      onChange?.(null);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      // Never submit the surrounding form while the list is open.
      event.preventDefault();
      const bank = results[activeIndex];
      if (bank) choose(bank);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const activeOptionId = open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

  return (
    <div className="relative">
      {name ? <input type="hidden" name={name} value={selected?.id ?? ""} /> : null}
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-required={required}
        placeholder={placeholder}
        disabled={disabled}
        value={query}
        onChange={(e) => typed(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-lg border border-line bg-surface px-3 pr-9 text-[14.5px] text-ink placeholder:text-faint transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60"
      />
      {loading && open ? (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-subtle" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      )}
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-[10px] border border-line bg-surface p-1 shadow-[0_12px_30px_rgba(32,38,74,0.15)]"
        >
          {failed ? (
            <li className="px-3 py-2 text-[13.5px] text-danger">Couldn&apos;t load banks. Try again.</li>
          ) : results.length === 0 && !loading ? (
            <li className="px-3 py-2 text-[13.5px] text-subtle">No banks match &ldquo;{term}&rdquo;</li>
          ) : (
            results.map((bank, index) => (
              <li
                key={bank.id}
                id={`${listboxId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={index === activeIndex}
                // mousedown, not click: fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(bank);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-[14px] text-ink",
                  index === activeIndex && "bg-brand-surface",
                )}
              >
                <span className="truncate">{bank.name}</span>
                <span className="shrink-0 font-mono text-[12px] text-subtle">{bank.code}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
