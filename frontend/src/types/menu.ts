export type MenuItem = {
  menuCode: string;
  title: string;
  path: string;
  mdi?: {
    closable?: boolean;
    pinned?: boolean;
    reuse?: "by-menu-code" | "by-path";
  };
};

export type MenuGroup = {
  menuGroupCode: string;
  title: string;
  menus: MenuItem[];
};
