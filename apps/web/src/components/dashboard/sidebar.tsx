import { SidebarContent } from "./sidebar-content";
import type { ActivationProgress } from "./sidebar-nav";

/** Desktop-only fixed sidebar. Mobile uses MobileSidebar's slide-in drawer instead. */
export function Sidebar({ activation }: { activation?: ActivationProgress }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col overflow-y-auto bg-ink px-3.5 py-[22px] md:flex">
      <SidebarContent activation={activation} />
    </aside>
  );
}
