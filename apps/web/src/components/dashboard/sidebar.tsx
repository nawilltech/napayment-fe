import { SidebarNav } from "./sidebar-nav";

/** Desktop-only fixed sidebar. Mobile uses MobileSidebar's slide-in drawer instead. */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-navy-900 px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-cream-200 text-sm font-bold text-navy-900">
          N
        </span>
        <span className="font-semibold text-cream-50">Nawill Pay</span>
      </div>
      <SidebarNav />
    </aside>
  );
}
