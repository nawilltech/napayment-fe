import { Logo } from "@/components/brand/logo";

// Who collects with Napayment, and what they collect. Kept to four so the
// grid reads at a glance; "associations" covers unions, estates, churches.
const SECTORS = [
  { name: "Schools", collects: "Tuition, levies, excursions" },
  { name: "Hospitals & clinics", collects: "Bills, deposits, pharmacy" },
  { name: "Government agencies", collects: "Permits, licences, levies" },
  { name: "Businesses & associations", collects: "Invoices, dues, subscriptions" },
];

/**
 * Task first: the form sits on the left (where the eye lands and where the
 * logo conventionally lives) and comes first in the DOM, so keyboard and
 * screen-reader order match what's on screen. The brand panel is supporting
 * context on the right, and is dropped on smaller screens, where logo,
 * tagline and form stay together as one centred group.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      <main className="flex flex-col justify-center px-4 py-8 sm:px-14 lg:justify-start lg:py-14">
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          <Logo size={36} wordmarkClassName="text-ink" />
          <p className="max-w-[320px] text-[13.5px] text-muted lg:hidden">
            Collections for schools, hospitals, government agencies and businesses.
          </p>
        </div>
        <div className="flex justify-center pt-8 lg:flex-1 lg:items-center lg:py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
      </main>

      {/* Brand panel - Nawill Blue, typewriter headline (Web 01 Sign in) */}
      <aside className="hidden flex-col bg-brand p-14 text-cream lg:flex">
        <div className="flex flex-1 flex-col justify-center gap-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-soft">
            Collections for organisations
          </p>
          <h2 className="font-display text-[52px] font-normal leading-[1.1]">
            Every payment,
            <br />
            on record.
          </h2>
          <p className="max-w-[460px] text-[17px] leading-relaxed text-brand-soft">
            One place for every fee, bill and levy your organisation collects. Payers use a bank transfer, a
            payment link or cash at an agent. Each gets an SMS receipt, and every naira lands on a record you can
            reconcile.
          </p>
          <ul className="mt-4 grid max-w-[520px] grid-cols-2 gap-x-8 gap-y-5">
            {SECTORS.map((sector) => (
              <li key={sector.name} className="border-t border-brand-line/40 pt-3">
                <p className="text-[15px] font-semibold">{sector.name}</p>
                <p className="mt-0.5 text-[13.5px] text-brand-soft">{sector.collects}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-soft">
          A Nawill Technology Ltd product · RC 1765112
        </p>
      </aside>
    </div>
  );
}
