export type Department = {
  id: number;
  companyId: number;
  departmentCode: string;
  departmentName: string;
  businessUnitId?: number;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
};

export type DepartmentForm = {
  departmentCode: string;
  departmentName: string;
  businessUnitId: string;
  parentId: string;
  isActive: boolean;
  sortOrder: string;
};

export type DepartmentQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
