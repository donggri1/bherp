"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { MenuGroup as MenuGroupType } from "@/types/menu";
import { cn } from "@/lib/utils";

type MenuGroupProps = {
  group: MenuGroupType;
};

export function MenuGroup({ group }: MenuGroupProps) {
  const pathname = usePathname();

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
