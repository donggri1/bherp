import type { MenuItem } from "@/types/menu";

export type MdiTabId = string;

export type MdiTab = {
  id: MdiTabId;
  menuCode: string;
  title: string;
  path: string;
  pinned: boolean;
  closable: boolean;
  order: number;
  openedAt: number;
  lastActivatedAt: number;
};

export type MdiTabsState = {
  tabs: MdiTab[];
  activeTabId: MdiTabId;
  instanceId: string;
  hydrated: boolean;
  version: number;
};

export type PersistedMdiTabsState = Omit<MdiTabsState, "hydrated">;

export type MdiTabsActions = {
  openTab: (menu: MenuItem) => void;
  activateTab: (tabId: MdiTabId) => void;
  closeTab: (tabId: MdiTabId) => void;
  closeCurrentTab: () => void;
  closeOtherTabs: (tabId: MdiTabId) => void;
  closeTabsToLeft: (tabId: MdiTabId) => void;
  closeTabsToRight: (tabId: MdiTabId) => void;
  closeAllTabs: () => void;
  refreshTab: (tabId: MdiTabId) => void;
  togglePinTab: (tabId: MdiTabId) => void;
  reorderTabs: (sourceTabId: MdiTabId, targetTabId: MdiTabId) => void;
};

export type MdiTabsContextValue = MdiTabsState &
  MdiTabsActions & {
    activeTab: MdiTab;
  };
