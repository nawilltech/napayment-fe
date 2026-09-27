/** Current search params plus changes, as a URL - for filter chips and pager links. Empty values are dropped. */
export function hrefWith(path: string, current: Record<string, string | undefined>, changes: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** `?page=` is 1-based for people; the API is 0-based. */
export function pageIndex(page: string | undefined) {
  const n = Number(page);
  return Number.isInteger(n) && n > 1 ? n - 1 : 0;
}
