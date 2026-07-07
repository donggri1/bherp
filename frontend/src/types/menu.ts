export type MenuMdiConfig = {
  closable?: boolean;
  pinned?: boolean;
  reuse?: "by-menu-code" | "by-path";
};

export type MenuItem = {
  menuCode: string;
  title: string;
  path: string;
  moduleCode?: string;
  mdi?: MenuMdiConfig;
};

export type MenuNode = {
  menuCode: string;
  title: string;
  path?: string;
  moduleCode?: string;
  children?: MenuNode[];
  mdi?: MenuMdiConfig;
};

export type MenuGroup = {
  menuGroupCode: string;
  title: string;
  moduleCode?: string;
  menus: MenuNode[];
};
