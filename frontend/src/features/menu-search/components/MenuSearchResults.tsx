"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SearchableMenuItem } from "../types/menu-search.types";

type MenuSearchResultsProps = {
  activePath: string;
  results: SearchableMenuItem[];
  selectedIndex: number;
  onHover: (index: number) => void;
  onSelect: (menu: SearchableMenuItem) => void;
};

export function MenuSearchResults({
  activePath,
  results,
  selectedIndex,
  onHover,
  onSelect,
}: MenuSearchResultsProps) {
  if (!results.length) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
        <Search className="size-5" aria-hidden />
        <p>검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[54vh] overflow-auto rounded-md border bg-background">
      {results.map((menu, index) => {
        const selected = index === selectedIndex;
        const active = activePath === menu.path;

        return (
          <button
            key={menu.menuCode}
            type="button"
            className={cn(
              "flex w-full min-w-0 flex-col gap-0.5 border-b px-3 py-2.5 text-left text-sm last:border-b-0",
              "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
              selected || active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(menu)}
          >
            <span className="truncate font-medium">{menu.title}</span>
            <span
              className={cn(
                "truncate text-xs",
                selected || active ? "text-primary-foreground/75" : "text-muted-foreground",
              )}
            >
              {menu.breadcrumb} / {menu.path}
            </span>
          </button>
        );
      })}
    </div>
  );
}
