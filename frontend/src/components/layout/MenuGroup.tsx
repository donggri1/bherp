"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import type { MenuGroup as MenuGroupType } from "@/types/menu";
import type { MenuItem, MenuNode } from "@/types/menu";
import { useMdiTabs } from "@/features/mdi-tabs/hooks/useMdiTabs";
import { cn } from "@/lib/utils";

type MenuGroupProps = {
  group: MenuGroupType;
  onNavigate?: () => void;
};

function isMenuItem(node: MenuNode): node is MenuItem {
  return Boolean(node.path);
}

function nodeContainsPath(node: MenuNode, pathname: string): boolean {
  if (isMenuItem(node) && node.path === pathname) {
    return true;
  }

  return node.children?.some((child) => nodeContainsPath(child, pathname)) ?? false;
}

function groupContainsPath(group: MenuGroupType, pathname: string) {
  return group.menus.some((menu) => nodeContainsPath(menu, pathname));
}

export function MenuGroup({ group, onNavigate }: MenuGroupProps) {
  const pathname = usePathname();
  const { openTab } = useMdiTabs();
  const groupActive = groupContainsPath(group, pathname);
  const [open, setOpen] = useState(true);
  const expanded = open || groupActive;

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

  const renderMenuNode = (node: MenuNode, depth = 0) => {
    const childNodes = node.children ?? [];

    if (isMenuItem(node) && childNodes.length === 0) {
      const active = pathname === node.path;

      return (
        <Link
          key={node.menuCode}
          href={node.path}
          onClick={(event) => handleMenuClick(event, node)}
          className={cn(
            "flex h-8 min-w-0 items-center rounded-md px-3 text-sm font-medium transition-colors",
            depth > 0 && "pl-5",
            depth > 1 && "pl-7",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="truncate">{node.title}</span>
        </Link>
      );
    }

    if (childNodes.length === 0) {
      return null;
    }

    return (
      <div key={node.menuCode} className="space-y-1">
        <div
          className={cn(
            "px-3 pt-1 text-[11px] font-semibold text-muted-foreground",
            depth > 0 && "pl-5",
            depth > 1 && "pl-7",
          )}
        >
          {node.title}
        </div>
        <div className="space-y-1">
          {childNodes.map((child) => renderMenuNode(child, depth + 1))}
        </div>
      </div>
    );
  };

  if (!group.menus.length) {
    return null;
  }

  return (
    <section className="space-y-1">
      <button
        type="button"
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
          groupActive
            ? "bg-muted text-foreground"
            : "text-foreground hover:bg-muted",
        )}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="truncate">{group.title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <nav className="space-y-2">
          {group.menus.map((node) => renderMenuNode(node))}
        </nav>
      ) : null}
    </section>
  );
}
