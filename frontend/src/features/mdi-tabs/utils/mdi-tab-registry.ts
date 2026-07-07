import { getLeafMenuItems } from "@/config/menus";
import type { MenuItem } from "@/types/menu";

import type { MdiTab } from "../types/mdi-tab.types";
import { normalizeMdiPath } from "./mdi-tab-route";

export const HOME_TAB_ID = "HOME";

export const HOME_MENU: MenuItem = {
  menuCode: HOME_TAB_ID,
  title: "Home",
  path: "/dashboard",
  mdi: {
    closable: false,
    pinned: true,
  },
};

export function getRegisteredMenus() {
  return [HOME_MENU, ...getLeafMenuItems()];
}

export function getTabId(menu: MenuItem) {
  return menu.mdi?.reuse === "by-path" ? normalizeMdiPath(menu.path) : menu.menuCode;
}

export function findMenuByPath(path: string) {
  const normalizedPath = normalizeMdiPath(path);

  return getRegisteredMenus().find(
    (menu) => normalizeMdiPath(menu.path) === normalizedPath,
  );
}

export function findMenuByCode(menuCode: string) {
  return getRegisteredMenus().find((menu) => menu.menuCode === menuCode);
}

export function isRegisteredMdiPath(path: string) {
  return Boolean(findMenuByPath(path));
}

export function createTabFromMenu(menu: MenuItem, now: number, order: number): MdiTab {
  const pinned = menu.menuCode === HOME_TAB_ID || Boolean(menu.mdi?.pinned);
  const closable =
    menu.menuCode === HOME_TAB_ID ? false : (menu.mdi?.closable ?? true) && !pinned;

  return {
    id: getTabId(menu),
    menuCode: menu.menuCode,
    title: menu.title,
    path: normalizeMdiPath(menu.path),
    pinned,
    closable,
    order,
    openedAt: now,
    lastActivatedAt: now,
  };
}
