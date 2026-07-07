export type OrganizationChartNode = {
  id: number;
  departmentCode: string;
  departmentName: string;
  businessUnitId?: number | null;
  parentId?: number | null;
  isActive: boolean;
  sortOrder: number;
  totalEmployees: number;
  activeEmployees: number;
  children: OrganizationChartNode[];
};

export type OrganizationChartEmployee = {
  id: number;
  employeeCode: string;
  employeeName: string;
  departmentId?: number | null;
  departmentName?: string | null;
  positionId?: number | null;
  positionName?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  resignDate?: string | null;
  isActive: boolean;
  employmentStatus: "active" | "resigned" | "inactive";
};

export type OrganizationChart = {
  totals: {
    departmentCount: number;
    totalEmployees: number;
    activeEmployees: number;
    unassignedEmployees: number;
  };
  items: OrganizationChartNode[];
};

export type OrganizationChartDepartmentEmployees = {
  department: {
    id: number;
    departmentCode: string;
    departmentName: string;
  } | null;
  items: OrganizationChartEmployee[];
  total: number;
  page: number;
  limit: number;
};
