export type Role = {
  id: number;
  companyId: number;
  roleCode: string;
  roleName: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
};

export type RoleForm = {
  roleCode: string;
  roleName: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
};

export type Menu = {
  id: number;
  menuCode: string;
  menuName: string;
  menuGroupCode: string;
  path: string;
  sortOrder: number;
  isActive: boolean;
};

export type RoleMenuPermission = {
  menuId: number;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExcel: boolean;
};

export type RoleMenuPermissionRow = {
  menu: Menu;
  permission: RoleMenuPermission;
};
