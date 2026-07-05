"use client";

import { useEffect, useRef, useState } from "react";

import type { MdiTabId } from "../types/mdi-tab.types";
import { useMdiTabs } from "../hooks/useMdiTabs";
import { MdiTabItem } from "./MdiTabItem";

export function MdiTabBar() {
  const { tabs, activeTabId, reorderTabs } = useMdiTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggingTabId, setDraggingTabId] = useState<MdiTabId | null>(null);

  useEffect(() => {
    const activeTabElement = scrollContainerRef.current?.querySelector<HTMLElement>(
      `[data-mdi-tab-id="${activeTabId}"]`,
    );

    activeTabElement?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTabId, tabs.length]);

  return (
    <div className="shrink-0 border-b border-slate-300 bg-slate-200 px-2 pt-1">
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="열린 업무 화면"
        className="flex h-9 min-w-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
            return;
          }

          event.currentTarget.scrollLeft += event.deltaY;
          event.preventDefault();
        }}
      >
        {tabs.map((tab) => (
          <MdiTabItem
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
            draggingTabId={draggingTabId}
            onDragStart={setDraggingTabId}
            onDragEnd={() => setDraggingTabId(null)}
            onDropTab={(targetTabId) => {
              if (draggingTabId) {
                reorderTabs(draggingTabId, targetTabId);
              }

              setDraggingTabId(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}
