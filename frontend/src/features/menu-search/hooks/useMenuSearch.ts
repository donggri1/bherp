"use client";

import { useMemo } from "react";

import { menuGroups } from "@/config/menus";

import { createSearchableMenus, searchMenus } from "../utils/menu-search";

export function useMenuSearch(keyword: string) {
  const searchableMenus = useMemo(() => createSearchableMenus(menuGroups), []);
  const results = useMemo(
    () => searchMenus(searchableMenus, keyword),
    [keyword, searchableMenus],
  );

  return {
    results,
    searching: keyword.trim().length > 0,
  };
}
