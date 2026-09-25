/**
 * Formatting helpers. Written by hand rather than via Intl so output is
 * identical on Hermes/Android builds that ship reduced ICU data.
 */

function group(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Kobo (minor units, string or number) -> "₦1,284,500.00". */
export function formatNaira(minor: string | number | null | undefined, opts: { decimals?: boolean } = {}) {
  const kobo = Number(minor ?? 0);
  if (!Number.isFinite(kobo)) return '₦0.00';
  const negative = kobo < 0;
  const abs = Math.abs(Math.round(kobo));
  const naira = group(String(Math.floor(abs / 100)));
  const body = opts.decimals === false ? naira : `${naira}.${String(abs % 100).padStart(2, '0')}`;
  return `${negative ? '−' : ''}₦${body}`;
}

/** "30,000.50" / "30000" -> "3000050" kobo, or undefined when not a positive amount. */
export function nairaToKobo(naira: string): string | undefined {
  const cleaned = naira.replace(/[,\s₦]/g, '');
  if (!cleaned) return undefined;
  const value = Math.round(Number(cleaned) * 100);
  return Number.isFinite(value) && value > 0 ? String(value) : undefined;
}

/** Live-format a naira amount while typing: keeps one dot, max 2 decimals, groups thousands. */
export function formatAmountInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const decimals = rest.join('').slice(0, 2);
  const grouped = group(whole.replace(/^0+(?=\d)/, ''));
  return cleaned.includes('.') ? `${grouped || '0'}.${decimals}` : grouped;
}

/** NUBAN reads in 4-3-3 groups, the way it's said aloud. */
export function groupAccountNumber(value: string) {
  return value.length === 10 ? `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}` : value;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTime(iso: string | number) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(iso: string | number) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string | number) {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Section label for grouped lists: TODAY / YESTERDAY / 22 SEP 2026. */
export function dayLabel(iso: string) {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (day === today) return 'Today';
  if (day === today - 86_400_000) return 'Yesterday';
  return formatDate(iso);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

/** mm:ss until `iso`, clamped at 00:00. */
export function countdown(iso: string, now = Date.now()) {
  const secs = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}
