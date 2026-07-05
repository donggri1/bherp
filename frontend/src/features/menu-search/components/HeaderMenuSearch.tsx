"use client";

import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MenuSearchDialog } from "./MenuSearchDialog";

type HeaderMenuSearchProps = {
  className?: string;
};

export function HeaderMenuSearch({ className }: HeaderMenuSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const openSearchDialog = () => {
    setDialogOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openSearchDialog();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setKeyword("");
    }
  };

  return (
    <>
      <div className={cn("flex min-w-0 items-center justify-center", className)}>
        <form
          className="hidden w-80 max-w-[34vw] items-center gap-1.5 md:flex"
          onSubmit={handleSubmit}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleInputKeyDown}
              className="h-8 pl-8 pr-8"
              placeholder="메뉴 검색"
            />
            {keyword ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setKeyword("")}
                aria-label="검색어 지우기"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
          <Button type="submit" variant="outline" size="sm">
            <Search className="size-3.5" aria-hidden />
            검색
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={openSearchDialog}
          aria-label="메뉴 검색"
        >
          <Search className="size-5" aria-hidden />
        </Button>
      </div>
      <MenuSearchDialog
        keyword={keyword}
        open={dialogOpen}
        onKeywordChange={setKeyword}
        onOpenChange={setDialogOpen}
        onComplete={() => setKeyword("")}
      />
    </>
  );
}
