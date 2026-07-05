import type { MenuGroup } from "@/types/menu";

import type { SearchableMenuItem } from "../types/menu-search.types";

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

export function createSearchableMenus(menuGroups: MenuGroup[]): SearchableMenuItem[] {
  return menuGroups.flatMap((group) =>
    group.menus.map((menu) => ({
      ...menu,
      groupCode: group.menuGroupCode,
      groupTitle: group.title,
      keywords: [
        group.title,
        group.menuGroupCode,
        menu.title,
        menu.menuCode,
        menu.path,
      ]
        .join(" ")
        .toLowerCase(),
    })),
  );
}

export function searchMenus(
  menus: SearchableMenuItem[],
  keyword: string,
): SearchableMenuItem[] {
  const normalizedKeyword = normalizeKeyword(keyword);

  if (!normalizedKeyword) {
    return menus;
  }

  return menus.filter((menu) => menu.keywords.includes(normalizedKeyword));
}
