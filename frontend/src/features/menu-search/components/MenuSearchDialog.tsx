"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Dialog } from "radix-ui";
import { Search, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMdiTabs } from "@/features/mdi-tabs/hooks/useMdiTabs";

import { useMenuSearch } from "../hooks/useMenuSearch";
import type { SearchableMenuItem } from "../types/menu-search.types";
import { MenuSearchResults } from "./MenuSearchResults";

type MenuSearchDialogProps = {
  keyword: string;
  open: boolean;
  onKeywordChange: (keyword: string) => void;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};

function clampSelectedIndex(index: number, resultsLength: number) {
  if (resultsLength <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), resultsLength - 1);
}

export function MenuSearchDialog({
  keyword,
  open,
  onKeywordChange,
  onOpenChange,
  onComplete,
}: MenuSearchDialogProps) {
  const pathname = usePathname();
  const { openTab } = useMdiTabs();
  const { results, searching } = useMenuSearch(keyword);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeSelectedIndex = clampSelectedIndex(selectedIndex, results.length);

  const selectMenu = (menu: SearchableMenuItem) => {
    openTab(menu);
    onKeywordChange("");
    onOpenChange(false);
    onComplete?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => clampSelectedIndex(current + 1, results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => clampSelectedIndex(current - 1, results.length));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedMenu = results[safeSelectedIndex];

      if (selectedMenu) {
        selectMenu(selectedMenu);
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-16 z-50 flex max-h-[calc(100vh-5rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-3 rounded-md border bg-background p-4 shadow-xl outline-none md:top-20">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-sm font-semibold">메뉴 검색</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="검색 닫기">
                <X className="size-4" aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={keyword}
              onChange={(event) => {
                onKeywordChange(event.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="h-9 pl-9 pr-8"
              placeholder="메뉴명, 메뉴 코드, 경로 검색"
            />
            {keyword ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  onKeywordChange("");
                  setSelectedIndex(0);
                }}
                aria-label="검색어 지우기"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{searching ? "검색 결과" : "전체 메뉴"}</span>
            <span>{results.length}개</span>
          </div>
          <MenuSearchResults
            activePath={pathname}
            results={results}
            selectedIndex={safeSelectedIndex}
            onHover={setSelectedIndex}
            onSelect={selectMenu}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
