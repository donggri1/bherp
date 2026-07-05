"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import type { MenuItem } from "@/types/menu";

import type {
  MdiTab,
  MdiTabId,
  MdiTabsContextValue,
  MdiTabsState,
  PersistedMdiTabsState,
} from "./types/mdi-tab.types";
import {
  createTabFromMenu,
  findMenuByCode,
  findMenuByPath,
  getTabId,
  HOME_MENU,
  HOME_TAB_ID,
  isRegisteredMdiPath,
} from "./utils/mdi-tab-registry";
import { normalizeMdiPath } from "./utils/mdi-tab-route";
import {
  getOrCreateMdiInstanceId,
  loadPersistedMdiState,
  MDI_STORAGE_VERSION,
  savePersistedMdiState,
} from "./utils/mdi-tab-storage";

type MdiTabsReducerAction =
  | {
      type: "HYDRATE";
      instanceId: string;
      persistedState: PersistedMdiTabsState | null;
      pathname: string;
      now: number;
    }
  | { type: "OPEN_TAB"; menu: MenuItem; now: number }
  | { type: "ACTIVATE_TAB"; tabId: MdiTabId; now: number }
  | { type: "CLOSE_TAB"; tabId: MdiTabId }
  | { type: "CLOSE_CURRENT_TAB" }
  | { type: "CLOSE_OTHER_TABS"; tabId: MdiTabId }
  | { type: "CLOSE_TABS_TO_LEFT"; tabId: MdiTabId }
  | { type: "CLOSE_TABS_TO_RIGHT"; tabId: MdiTabId }
  | { type: "CLOSE_ALL_TABS" }
  | { type: "TOGGLE_PIN_TAB"; tabId: MdiTabId }
  | { type: "REORDER_TABS"; sourceTabId: MdiTabId; targetTabId: MdiTabId };

const MdiTabsContext = createContext<MdiTabsContextValue | null>(null);

function createHomeTab(now = 0) {
  return createTabFromMenu(HOME_MENU, now, 0);
}

function createInitialState(): MdiTabsState {
  return {
    tabs: [createHomeTab()],
    activeTabId: HOME_TAB_ID,
    instanceId: "",
    hydrated: false,
    version: MDI_STORAGE_VERSION,
  };
}

function isProtectedTab(tab: MdiTab) {
  return tab.id === HOME_TAB_ID || tab.pinned || !tab.closable;
}

function coerceRegisteredTab(tab: MdiTab) {
  const menu = findMenuByCode(tab.menuCode) ?? findMenuByPath(tab.path);

  if (!menu) {
    return null;
  }

  const id = getTabId(menu);
  const pinned = id === HOME_TAB_ID || tab.pinned || Boolean(menu.mdi?.pinned);
  const closable = id === HOME_TAB_ID ? false : (menu.mdi?.closable ?? true) && !pinned;

  return {
    ...tab,
    id,
    menuCode: menu.menuCode,
    title: menu.title,
    path: normalizeMdiPath(menu.path),
    pinned,
    closable,
  };
}

function normalizeTabs(tabs: MdiTab[]) {
  const sortedTabs = [...tabs].sort((first, second) => first.order - second.order);
  const seenTabIds = new Set<MdiTabId>();
  const normalizedTabs: MdiTab[] = [];

  for (const tab of sortedTabs) {
    const registeredTab = coerceRegisteredTab(tab);

    if (!registeredTab || seenTabIds.has(registeredTab.id)) {
      continue;
    }

    seenTabIds.add(registeredTab.id);
    normalizedTabs.push(registeredTab);
  }

  if (!seenTabIds.has(HOME_TAB_ID)) {
    normalizedTabs.unshift(createHomeTab());
  }

  const homeTab = normalizedTabs.find((tab) => tab.id === HOME_TAB_ID) ?? createHomeTab();
  const pinnedTabs = normalizedTabs.filter(
    (tab) => tab.id !== HOME_TAB_ID && tab.pinned,
  );
  const regularTabs = normalizedTabs.filter(
    (tab) => tab.id !== HOME_TAB_ID && !tab.pinned,
  );

  return [homeTab, ...pinnedTabs, ...regularTabs].map((tab, order) => ({
    ...tab,
    order,
    pinned: tab.id === HOME_TAB_ID || tab.pinned,
    closable: tab.id === HOME_TAB_ID ? false : tab.closable && !tab.pinned,
  }));
}

function getActiveTab(state: MdiTabsState) {
  return (
    state.tabs.find((tab) => tab.id === state.activeTabId) ??
    state.tabs.find((tab) => tab.id === HOME_TAB_ID) ??
    createHomeTab()
  );
}

function getFallbackTabId(tabsBeforeClose: MdiTab[], remainingTabs: MdiTab[], tabId: MdiTabId) {
  const removedIndex = tabsBeforeClose.findIndex((tab) => tab.id === tabId);
  const rightTab = remainingTabs[removedIndex];
  const leftTab = remainingTabs[Math.max(removedIndex - 1, 0)];
  const homeTab = remainingTabs.find((tab) => tab.id === HOME_TAB_ID);

  return rightTab?.id ?? leftTab?.id ?? homeTab?.id ?? HOME_TAB_ID;
}

function withValidActiveTab(state: MdiTabsState) {
  if (state.tabs.some((tab) => tab.id === state.activeTabId)) {
    return state;
  }

  return {
    ...state,
    activeTabId: state.tabs[0]?.id ?? HOME_TAB_ID,
  };
}

function openTabInState(state: MdiTabsState, menu: MenuItem, now: number) {
  const tabId = getTabId(menu);
  const existingTabIndex = state.tabs.findIndex((tab) => tab.id === tabId);

  if (existingTabIndex >= 0) {
    const tabs = state.tabs.map((tab, index) =>
      index === existingTabIndex
        ? {
            ...tab,
            title: menu.title,
            path: normalizeMdiPath(menu.path),
            lastActivatedAt: now,
          }
        : tab,
    );

    return {
      ...state,
      tabs: normalizeTabs(tabs),
      activeTabId: tabId,
    };
  }

  return {
    ...state,
    tabs: normalizeTabs([
      ...state.tabs,
      createTabFromMenu(menu, now, state.tabs.length),
    ]),
    activeTabId: tabId,
  };
}

function hydrateState(
  state: MdiTabsState,
  instanceId: string,
  persistedState: PersistedMdiTabsState | null,
  pathname: string,
  now: number,
) {
  const baseState: MdiTabsState = persistedState
    ? {
        ...persistedState,
        hydrated: true,
      }
    : {
        ...state,
        instanceId,
        hydrated: true,
        version: MDI_STORAGE_VERSION,
      };

  const normalizedState = withValidActiveTab({
    ...baseState,
    instanceId,
    hydrated: true,
    version: MDI_STORAGE_VERSION,
    tabs: normalizeTabs(baseState.tabs),
  });

  const menu = findMenuByPath(pathname);

  if (!menu) {
    return normalizedState;
  }

  return openTabInState(normalizedState, menu, now);
}

function mdiTabsReducer(
  state: MdiTabsState,
  action: MdiTabsReducerAction,
): MdiTabsState {
  switch (action.type) {
    case "HYDRATE":
      return hydrateState(
        state,
        action.instanceId,
        action.persistedState,
        action.pathname,
        action.now,
      );

    case "OPEN_TAB":
      return openTabInState(state, action.menu, action.now);

    case "ACTIVATE_TAB": {
      if (!state.tabs.some((tab) => tab.id === action.tabId)) {
        return state;
      }

      return {
        ...state,
        activeTabId: action.tabId,
        tabs: state.tabs.map((tab) =>
          tab.id === action.tabId ? { ...tab, lastActivatedAt: action.now } : tab,
        ),
      };
    }

    case "CLOSE_TAB": {
      const tabToClose = state.tabs.find((tab) => tab.id === action.tabId);

      if (!tabToClose || isProtectedTab(tabToClose)) {
        return state;
      }

      const remainingTabs = normalizeTabs(
        state.tabs.filter((tab) => tab.id !== action.tabId),
      );

      const activeTabId =
        state.activeTabId === action.tabId
          ? getFallbackTabId(state.tabs, remainingTabs, action.tabId)
          : state.activeTabId;

      return withValidActiveTab({
        ...state,
        tabs: remainingTabs,
        activeTabId,
      });
    }

    case "CLOSE_CURRENT_TAB":
      return mdiTabsReducer(state, { type: "CLOSE_TAB", tabId: state.activeTabId });

    case "CLOSE_OTHER_TABS": {
      const targetTab = state.tabs.find((tab) => tab.id === action.tabId);

      if (!targetTab) {
        return state;
      }

      const remainingTabs = normalizeTabs(
        state.tabs.filter(
          (tab) => tab.id === action.tabId || tab.id === HOME_TAB_ID || tab.pinned,
        ),
      );

      return withValidActiveTab({
        ...state,
        tabs: remainingTabs,
        activeTabId: action.tabId,
      });
    }

    case "CLOSE_TABS_TO_LEFT": {
      const targetIndex = state.tabs.findIndex((tab) => tab.id === action.tabId);

      if (targetIndex < 0) {
        return state;
      }

      const removedTabIds = new Set(
        state.tabs
          .slice(0, targetIndex)
          .filter((tab) => !isProtectedTab(tab))
          .map((tab) => tab.id),
      );

      const remainingTabs = normalizeTabs(
        state.tabs.filter((tab) => !removedTabIds.has(tab.id)),
      );

      return withValidActiveTab({
        ...state,
        tabs: remainingTabs,
        activeTabId: removedTabIds.has(state.activeTabId)
          ? action.tabId
          : state.activeTabId,
      });
    }

    case "CLOSE_TABS_TO_RIGHT": {
      const targetIndex = state.tabs.findIndex((tab) => tab.id === action.tabId);

      if (targetIndex < 0) {
        return state;
      }

      const removedTabIds = new Set(
        state.tabs
          .slice(targetIndex + 1)
          .filter((tab) => !isProtectedTab(tab))
          .map((tab) => tab.id),
      );

      const remainingTabs = normalizeTabs(
        state.tabs.filter((tab) => !removedTabIds.has(tab.id)),
      );

      return withValidActiveTab({
        ...state,
        tabs: remainingTabs,
        activeTabId: removedTabIds.has(state.activeTabId)
          ? action.tabId
          : state.activeTabId,
      });
    }

    case "CLOSE_ALL_TABS": {
      const remainingTabs = normalizeTabs(
        state.tabs.filter((tab) => tab.id === HOME_TAB_ID || tab.pinned),
      );

      return withValidActiveTab({
        ...state,
        tabs: remainingTabs,
        activeTabId: remainingTabs.some((tab) => tab.id === state.activeTabId)
          ? state.activeTabId
          : HOME_TAB_ID,
      });
    }

    case "TOGGLE_PIN_TAB":
      return {
        ...state,
        tabs: normalizeTabs(
          state.tabs.map((tab) => {
            if (tab.id !== action.tabId || tab.id === HOME_TAB_ID) {
              return tab;
            }

            const pinned = !tab.pinned;

            return {
              ...tab,
              pinned,
              closable: !pinned,
            };
          }),
        ),
      };

    case "REORDER_TABS": {
      if (action.sourceTabId === action.targetTabId) {
        return state;
      }

      const sourceTab = state.tabs.find((tab) => tab.id === action.sourceTabId);
      const targetTab = state.tabs.find((tab) => tab.id === action.targetTabId);

      if (
        !sourceTab ||
        !targetTab ||
        sourceTab.id === HOME_TAB_ID ||
        targetTab.id === HOME_TAB_ID ||
        sourceTab.pinned !== targetTab.pinned
      ) {
        return state;
      }

      const reorderedTabs = [...state.tabs];
      const sourceIndex = reorderedTabs.findIndex((tab) => tab.id === action.sourceTabId);
      const targetIndex = reorderedTabs.findIndex((tab) => tab.id === action.targetTabId);
      const [movedTab] = reorderedTabs.splice(sourceIndex, 1);

      reorderedTabs.splice(targetIndex, 0, movedTab);

      return {
        ...state,
        tabs: normalizeTabs(
          reorderedTabs.map((tab, order) => ({
            ...tab,
            order,
          })),
        ),
      };
    }

    default:
      return state;
  }
}

type MdiTabsProviderProps = {
  children: React.ReactNode;
};

export function MdiTabsProvider({ children }: MdiTabsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const initialPathnameRef = useRef(pathname);
  const pathnameRef = useRef(pathname);
  const routeSyncPathnameRef = useRef(pathname);
  const stateRef = useRef(createInitialState());
  const hydratedRef = useRef(false);
  const pendingRefreshPathRef = useRef<string | null>(null);
  const [state, dispatch] = useReducer(mdiTabsReducer, undefined, createInitialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const navigateToActiveTab = useCallback(
    (nextState: MdiTabsState) => {
      const activeTab = getActiveTab(nextState);

      if (normalizeMdiPath(pathnameRef.current) !== activeTab.path) {
        router.push(activeTab.path);
      }
    },
    [router],
  );

  const commitAction = useCallback(
    (action: MdiTabsReducerAction, navigate = true) => {
      const nextState = mdiTabsReducer(stateRef.current, action);

      stateRef.current = nextState;
      dispatch(action);

      if (navigate) {
        navigateToActiveTab(nextState);
      }

      return nextState;
    },
    [navigateToActiveTab],
  );

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;

    const instanceId = getOrCreateMdiInstanceId();
    const persistedState = loadPersistedMdiState(instanceId);

    dispatch({
      type: "HYDRATE",
      instanceId,
      persistedState,
      pathname: initialPathnameRef.current,
      now: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    savePersistedMdiState(state);
  }, [state]);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    const previousPathname = normalizeMdiPath(routeSyncPathnameRef.current);
    const nextPathname = normalizeMdiPath(pathname);

    if (previousPathname === nextPathname) {
      return;
    }

    routeSyncPathnameRef.current = pathname;

    const menu = findMenuByPath(pathname);
    const activeTab = getActiveTab(stateRef.current);

    if (!menu || activeTab.path === normalizeMdiPath(menu.path)) {
      return;
    }

    dispatch({ type: "OPEN_TAB", menu, now: Date.now() });
  }, [pathname, state.hydrated]);

  useEffect(() => {
    const pendingRefreshPath = pendingRefreshPathRef.current;

    if (!pendingRefreshPath || normalizeMdiPath(pathname) !== pendingRefreshPath) {
      return;
    }

    pendingRefreshPathRef.current = null;
    router.refresh();
  }, [pathname, router]);

  const openTab = useCallback(
    (menu: MenuItem) => {
      commitAction({ type: "OPEN_TAB", menu, now: Date.now() });
    },
    [commitAction],
  );

  const activateTab = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "ACTIVATE_TAB", tabId, now: Date.now() });
    },
    [commitAction],
  );

  const closeTab = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "CLOSE_TAB", tabId });
    },
    [commitAction],
  );

  const closeCurrentTab = useCallback(() => {
    commitAction({ type: "CLOSE_CURRENT_TAB" });
  }, [commitAction]);

  const closeOtherTabs = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "CLOSE_OTHER_TABS", tabId });
    },
    [commitAction],
  );

  const closeTabsToLeft = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "CLOSE_TABS_TO_LEFT", tabId });
    },
    [commitAction],
  );

  const closeTabsToRight = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "CLOSE_TABS_TO_RIGHT", tabId });
    },
    [commitAction],
  );

  const closeAllTabs = useCallback(() => {
    commitAction({ type: "CLOSE_ALL_TABS" });
  }, [commitAction]);

  const refreshTab = useCallback(
    (tabId: MdiTabId) => {
      const nextState = mdiTabsReducer(stateRef.current, {
        type: "ACTIVATE_TAB",
        tabId,
        now: Date.now(),
      });
      const activeTab = getActiveTab(nextState);

      stateRef.current = nextState;
      dispatch({ type: "ACTIVATE_TAB", tabId, now: Date.now() });

      if (normalizeMdiPath(pathnameRef.current) === activeTab.path) {
        router.refresh();
        return;
      }

      pendingRefreshPathRef.current = activeTab.path;
      router.push(activeTab.path);
    },
    [router],
  );

  const togglePinTab = useCallback(
    (tabId: MdiTabId) => {
      commitAction({ type: "TOGGLE_PIN_TAB", tabId }, false);
    },
    [commitAction],
  );

  const reorderTabs = useCallback(
    (sourceTabId: MdiTabId, targetTabId: MdiTabId) => {
      commitAction({ type: "REORDER_TABS", sourceTabId, targetTabId }, false);
    },
    [commitAction],
  );

  const contextValue = useMemo<MdiTabsContextValue>(() => {
    const activeTab = getActiveTab(state);

    return {
      ...state,
      activeTab,
      openTab,
      activateTab,
      closeTab,
      closeCurrentTab,
      closeOtherTabs,
      closeTabsToLeft,
      closeTabsToRight,
      closeAllTabs,
      refreshTab,
      togglePinTab,
      reorderTabs,
    };
  }, [
    activateTab,
    closeAllTabs,
    closeCurrentTab,
    closeOtherTabs,
    closeTab,
    closeTabsToLeft,
    closeTabsToRight,
    openTab,
    refreshTab,
    reorderTabs,
    state,
    togglePinTab,
  ]);

  return (
    <MdiTabsContext.Provider value={contextValue}>{children}</MdiTabsContext.Provider>
  );
}

export function useMdiTabs() {
  const context = useContext(MdiTabsContext);

  if (!context) {
    throw new Error("useMdiTabs must be used within MdiTabsProvider");
  }

  return context;
}

export { HOME_TAB_ID, isProtectedTab, isRegisteredMdiPath };
