import type {
  MdiTabsState,
  PersistedMdiTabsState,
} from "../types/mdi-tab.types";

export const MDI_STORAGE_VERSION = 1;

const MDI_INSTANCE_KEY = "bherp.mdi.instanceId";
const MDI_STATE_KEY_PREFIX = "bherp.mdi.state.";

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function createInstanceId() {
  if (canUseBrowserStorage() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `mdi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateMdiInstanceId() {
  if (!canUseBrowserStorage()) {
    return "";
  }

  const existingInstanceId = window.sessionStorage.getItem(MDI_INSTANCE_KEY);

  if (existingInstanceId) {
    return existingInstanceId;
  }

  const instanceId = createInstanceId();
  window.sessionStorage.setItem(MDI_INSTANCE_KEY, instanceId);

  return instanceId;
}

export function loadPersistedMdiState(instanceId: string) {
  if (!canUseBrowserStorage() || !instanceId) {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem(`${MDI_STATE_KEY_PREFIX}${instanceId}`);

    if (!rawState) {
      return null;
    }

    const parsed = JSON.parse(rawState) as Partial<PersistedMdiTabsState>;

    if (
      parsed.version !== MDI_STORAGE_VERSION ||
      parsed.instanceId !== instanceId ||
      !Array.isArray(parsed.tabs) ||
      typeof parsed.activeTabId !== "string"
    ) {
      return null;
    }

    return parsed as PersistedMdiTabsState;
  } catch {
    return null;
  }
}

export function savePersistedMdiState(state: MdiTabsState) {
  if (!canUseBrowserStorage() || !state.instanceId || !state.hydrated) {
    return;
  }

  const persistedState: PersistedMdiTabsState = {
    version: state.version,
    instanceId: state.instanceId,
    activeTabId: state.activeTabId,
    tabs: state.tabs,
  };

  try {
    window.localStorage.setItem(
      `${MDI_STATE_KEY_PREFIX}${state.instanceId}`,
      JSON.stringify(persistedState),
    );
  } catch {
    // Storage can be unavailable in private windows or locked-down browsers.
  }
}
