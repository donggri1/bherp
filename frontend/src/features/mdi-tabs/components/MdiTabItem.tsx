"use client";

import type { DragEvent, KeyboardEvent } from "react";
import { Home, Pin, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MdiTab, MdiTabId } from "../types/mdi-tab.types";
import { HOME_TAB_ID } from "../utils/mdi-tab-registry";
import { useMdiTabs } from "../hooks/useMdiTabs";
import { MdiTabContextMenu } from "./MdiTabContextMenu";

type MdiTabItemProps = {
  tab: MdiTab;
  active: boolean;
  draggingTabId: MdiTabId | null;
  onDragStart: (tabId: MdiTabId) => void;
  onDragEnd: () => void;
  onDropTab: (targetTabId: MdiTabId) => void;
};

export function MdiTabItem({
  tab,
  active,
  draggingTabId,
  onDragStart,
  onDragEnd,
  onDropTab,
}: MdiTabItemProps) {
  const { activateTab, closeTab } = useMdiTabs();
  const isHomeTab = tab.id === HOME_TAB_ID;
  const canClose = tab.closable && !tab.pinned && !isHomeTab;
  const canDrag = !isHomeTab;
  const canDrop = Boolean(draggingTabId && draggingTabId !== tab.id && !isHomeTab);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateTab(tab.id);
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && canClose) {
      event.preventDefault();
      closeTab(tab.id);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!canDrag) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tab.id);
    onDragStart(tab.id);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canDrop) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!canDrop) {
      return;
    }

    event.preventDefault();
    onDropTab(tab.id);
  };

  return (
    <MdiTabContextMenu tab={tab}>
      <div
        role="tab"
        aria-selected={active}
        tabIndex={active ? 0 : -1}
        draggable={canDrag}
        data-mdi-tab-id={tab.id}
        onClick={() => activateTab(tab.id)}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={onDragEnd}
        onDrop={handleDrop}
        className={cn(
          "group flex h-8 max-w-52 shrink-0 cursor-default select-none items-center gap-1 border border-b-0 px-2 text-xs outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring/45",
          active
            ? "border-slate-400 bg-background text-foreground shadow-[inset_0_2px_0_var(--primary)]"
            : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          isHomeTab ? "min-w-20 rounded-t-sm font-semibold" : "min-w-32 rounded-t-sm",
          draggingTabId === tab.id && "opacity-45",
          canDrop && "ring-1 ring-primary/35",
        )}
      >
        {isHomeTab ? (
          <Home className="size-3.5 shrink-0" aria-hidden />
        ) : tab.pinned ? (
          <Pin className="size-3.5 shrink-0 text-primary" aria-hidden />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{tab.title}</span>
        {canClose ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-slate-500 opacity-70 transition-colors hover:bg-slate-200 hover:text-slate-950 group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              closeTab(tab.id);
            }}
            aria-label={`${tab.title} 닫기`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </MdiTabContextMenu>
  );
}
