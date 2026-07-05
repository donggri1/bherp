"use client";

import { ContextMenu } from "radix-ui";

import type { MdiTab } from "../types/mdi-tab.types";
import { HOME_TAB_ID } from "../utils/mdi-tab-registry";
import { useMdiTabs } from "../hooks/useMdiTabs";

type MdiTabContextMenuProps = {
  tab: MdiTab;
  children: React.ReactNode;
};

const itemClassName =
  "relative flex cursor-default select-none items-center rounded-sm px-2.5 py-1.5 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45";

function canCloseTab(tab: MdiTab) {
  return tab.id !== HOME_TAB_ID && tab.closable && !tab.pinned;
}

export function MdiTabContextMenu({ tab, children }: MdiTabContextMenuProps) {
  const {
    tabs,
    closeTab,
    closeOtherTabs,
    closeTabsToLeft,
    closeTabsToRight,
    closeAllTabs,
    refreshTab,
    togglePinTab,
  } = useMdiTabs();
  const tabIndex = tabs.findIndex((candidate) => candidate.id === tab.id);
  const hasClosableTabs = tabs.some(canCloseTab);
  const hasClosableOtherTabs = tabs.some(
    (candidate) => candidate.id !== tab.id && canCloseTab(candidate),
  );
  const hasClosableLeftTabs = tabs
    .slice(0, Math.max(tabIndex, 0))
    .some(canCloseTab);
  const hasClosableRightTabs = tabs.slice(tabIndex + 1).some(canCloseTab);
  const isHomeTab = tab.id === HOME_TAB_ID;
  const currentTabCloseDisabled = !canCloseTab(tab);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
          <ContextMenu.Item
            className={itemClassName}
            disabled={currentTabCloseDisabled}
            onSelect={() => closeTab(tab.id)}
          >
            현재 탭 닫기
          </ContextMenu.Item>
          <ContextMenu.Item
            className={itemClassName}
            disabled={!hasClosableOtherTabs}
            onSelect={() => closeOtherTabs(tab.id)}
          >
            다른 탭 닫기
          </ContextMenu.Item>
          <ContextMenu.Item
            className={itemClassName}
            disabled={!hasClosableLeftTabs}
            onSelect={() => closeTabsToLeft(tab.id)}
          >
            왼쪽 탭 닫기
          </ContextMenu.Item>
          <ContextMenu.Item
            className={itemClassName}
            disabled={!hasClosableRightTabs}
            onSelect={() => closeTabsToRight(tab.id)}
          >
            오른쪽 탭 닫기
          </ContextMenu.Item>
          <ContextMenu.Item
            className={itemClassName}
            disabled={!hasClosableTabs}
            onSelect={closeAllTabs}
          >
            전체 탭 닫기
          </ContextMenu.Item>
          <ContextMenu.Separator className="my-1 h-px bg-border" />
          <ContextMenu.Item className={itemClassName} onSelect={() => refreshTab(tab.id)}>
            새로고침
          </ContextMenu.Item>
          <ContextMenu.Item
            className={itemClassName}
            disabled={isHomeTab}
            onSelect={() => togglePinTab(tab.id)}
          >
            {tab.pinned ? "탭 고정 해제" : "탭 고정"}
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
