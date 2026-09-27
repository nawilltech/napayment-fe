/** Headline figure tile: label, big mono value, one-line context. */
export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-3.5 py-3.5 sm:px-[18px] sm:py-4">
      <p className="text-[12.5px] text-subtle">{label}</p>
      <p className="mt-1.5 truncate font-mono text-[17px] font-semibold text-ink sm:text-[22px]" title={value}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}
    </div>
  );
}
