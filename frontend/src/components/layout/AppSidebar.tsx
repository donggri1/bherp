import Link from "next/link";

import { menuGroups } from "@/config/menus";
import { MenuGroup } from "./MenuGroup";

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/20 p-4 md:block">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-6 block rounded-md px-3 py-2 text-sm font-semibold"
      >
        Dashboard
      </Link>
      <div className="space-y-6">
        {menuGroups.map((group) => (
          <MenuGroup key={group.menuGroupCode} group={group} onNavigate={onNavigate} />
        ))}
      </div>
    </aside>
  );
}
