"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { MenuGroup as MenuGroupType } from "@/types/menu";
import type { MenuItem } from "@/types/menu";
import { useMdiTabs } from "@/features/mdi-tabs/hooks/useMdiTabs";
import { cn } from "@/lib/utils";

type MenuGroupProps = {
  group: MenuGroupType;
  onNavigate?: () => void;
};

export function MenuGroup({ group, onNavigate }: MenuGroupProps) {
  const pathname = usePathname();
  const { openTab } = useMdiTabs();

  const handleMenuClick = (
    event: MouseEvent<HTMLAnchorElement>,
    menu: MenuItem,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    openTab(menu);
    onNavigate?.();
  };

  return (
    <section className="space-y-2">
      <h2 className="px-3 text-xs font-semibold uppercase text-muted-foreground">
        {group.title}
      </h2>
      <nav className="space-y-1">
        {group.menus.map((menu) => {
          const active = pathname === menu.path;
          return (
            <Link
              key={menu.menuCode}
              href={menu.path}
              onClick={(event) => handleMenuClick(event, menu)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {menu.title}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
