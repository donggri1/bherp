export type MenuItem = {
  menuCode: string;
  title: string;
  path: string;
};

export type MenuGroup = {
  menuGroupCode: string;
  title: string;
  menus: MenuItem[];
};
