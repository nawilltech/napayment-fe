import type { TransactionResponse, UserResponse } from "@napayment/api-client";

/**
 * Display formatting shared by the Business Console (web) and the Wallet App
 * (mobile). Written without Intl so output is identical everywhere, including
 * Hermes/Android release builds that ship reduced ICU data.
 */

// ---- Money ----------------------------------------------------------------------

function groupThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Kobo (minor units, string or number) -> "₦1,284,500.00"; `decimals: false` -> "₦1,284,500". */
export function formatNaira(minor: string | number | null | undefined, opts: { decimals?: boolean } = {}) {
  const kobo = Number(minor ?? 0);
  if (!Number.isFinite(kobo)) return "₦0.00";
  const abs = Math.abs(Math.round(kobo));
  const naira = groupThousands(String(Math.floor(abs / 100)));
  const body = opts.decimals === false ? naira : `${naira}.${String(abs % 100).padStart(2, "0")}`;
  return `${kobo < 0 ? "−" : ""}₦${body}`;
}

/** "30,000.50" / "30000" -> "3000050" kobo, or undefined when empty or not a positive amount. */
export function nairaToKobo(naira: string): string | undefined {
  const cleaned = naira.replace(/[,\s₦]/g, "");
  if (!cleaned) return undefined;
  const value = Math.round(Number(cleaned) * 100);
  return Number.isFinite(value) && value > 0 ? String(value) : undefined;
}

/** Kobo -> plain naira string for an input's value ("3000050" -> "30000.5"). */
export function koboToNairaInput(kobo?: string | null) {
  if (!kobo) return "";
  const value = Number(kobo) / 100;
  return Number.isFinite(value) ? String(value) : "";
}

/** Live-format a naira amount while typing: one dot, max 2 decimals, grouped thousands. */
export function formatAmountInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  const grouped = groupThousands(whole.replace(/^0+(?=\d)/, ""));
  return cleaned.includes(".") ? `${grouped || "0"}.${rest.join("").slice(0, 2)}` : grouped;
}

/** NUBAN reads in 4-3-3 groups, the way it's said aloud. */
export function groupAccountNumber(value: string) {
  return value.length === 10 ? `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}` : value;
}

// ---- Dates ----------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Accepts an ISO instant or a date-only "YYYY-MM-DD" (read as local midnight, not UTC). */
function toDate(value: string | number) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "09:51" */
export function formatTime(value: string | number) {
  const d = toDate(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "25 Sep" */
export function formatDayMonth(value: string | number) {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "25 Sep 2026" */
export function formatDate(value: string | number) {
  return `${formatDayMonth(value)} ${toDate(value).getFullYear()}`;
}

/** "25 Sep 2026, 09:51" */
export function formatDateTime(value: string | number) {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Section label for grouped lists: "Today" / "Yesterday" / "22 Sep 2026". */
export function dayLabel(value: string) {
  const day = startOfDay(toDate(value));
  const today = startOfDay(new Date());
  if (day === today) return "Today";
  if (day === today - 86_400_000) return "Yesterday";
  return formatDate(value);
}

/** "mm:ss" until `iso`, clamped at "00:00". */
export function countdown(iso: string, now = Date.now()) {
  const secs = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
  return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning," : h < 17 ? "Good afternoon," : "Good evening,";
}

// ---- Words ----------------------------------------------------------------------

/** plural(1, "payment") -> "1 payment"; plural(3, "payment") -> "3 payments". */
export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Up to two initials: "Greenfield Sec. School" -> "GS". */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** The name an account goes by: its business name, else the person's. */
export function displayName(user: Pick<UserResponse, "businessName" | "firstName" | "lastName">) {
  return user.businessName ?? `${user.firstName} ${user.lastName}`;
}

// ---- Transactions ---------------------------------------------------------------

/**
 * TransactionResponse carries no payer/merchant name, so rows are named by
 * what happened. Transfer legs share a transferGroupId (one DEBIT + one CREDIT).
 */
export function describeTransaction(txn: Pick<TransactionResponse, "transactionType" | "transferGroupId" | "amount">) {
  const credit = txn.transactionType === "CREDIT";
  const transfer = Boolean(txn.transferGroupId);
  return {
    credit,
    /** Short kind for tables and filters. */
    kind: transfer ? "Transfer" : credit ? "Credit" : "Debit",
    /** Sentence-style title for lists and receipts. */
    title: transfer ? (credit ? "Transfer received" : "Transfer sent") : credit ? "Payment received" : "Withdrawal",
    /** How the money moved. */
    method: transfer ? "Transfer" : credit ? "Collection" : "Payout",
    signedAmount: `${credit ? "+" : "−"}${formatNaira(txn.amount, { decimals: false })}`,
  };
}
