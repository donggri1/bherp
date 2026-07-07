import type { MenuGroup, MenuItem, MenuNode } from "@/types/menu";

import type { SearchableMenuItem } from "../types/menu-search.types";

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

export function createSearchableMenus(menuGroups: MenuGroup[]): SearchableMenuItem[] {
  return menuGroups.flatMap((group) =>
    createSearchableMenuNodes(group.menus, {
      groupCode: group.menuGroupCode,
      groupTitle: group.title,
      parentTitles: [group.title],
      parentCodes: [group.menuGroupCode],
    }),
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

type SearchContext = {
  groupCode: string;
  groupTitle: string;
  parentTitles: string[];
  parentCodes: string[];
};

function isMenuItem(node: MenuNode): node is MenuItem {
  return Boolean(node.path);
}

function createSearchableMenuNodes(
  nodes: MenuNode[],
  context: SearchContext,
): SearchableMenuItem[] {
  return nodes.flatMap((node) => {
    const titles = [...context.parentTitles, node.title];
    const codes = [...context.parentCodes, node.menuCode];
    const childResults = node.children
      ? createSearchableMenuNodes(node.children, {
          ...context,
          parentTitles: titles,
          parentCodes: codes,
        })
      : [];

    if (!isMenuItem(node)) {
      return childResults;
    }

    const breadcrumb = titles.join(" > ");

    return [
      {
        ...node,
        groupCode: context.groupCode,
        groupTitle: context.groupTitle,
        breadcrumb,
        breadcrumbTitles: titles,
        keywords: [...titles, ...codes, node.path].join(" ").toLowerCase(),
      },
      ...childResults,
    ];
  });
}
