import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Brand panel - Nawill Blue, typewriter headline (Web 01 Sign in) */}
      <aside className="hidden flex-col bg-brand p-14 text-cream lg:flex">
        <Logo size={40} tone="cream" letterClassName="text-brand" wordmarkClassName="text-cream" />
        <div className="flex flex-1 flex-col justify-center gap-5">
          <p className="font-display text-[52px] leading-[1.1]">
            Every payment,
            <br />
            on record.
          </p>
          <p className="max-w-[420px] text-[17px] leading-relaxed text-brand-soft">
            Collect school fees, agency bills and business income by transfer, link or cash. Receipts go out by
            SMS.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-soft">
          A Nawill Technology Ltd product · RC 1765112
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-14">
        <div className="mb-8 lg:hidden">
          <Logo size={36} wordmarkClassName="text-ink" />
        </div>
        <div className="w-full max-w-[380px]">{children}</div>
      </main>
    </div>
  );
}
