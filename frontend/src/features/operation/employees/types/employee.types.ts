export type Employee = {
  id: number;
  companyId: number;
  employeeCode: string;
  employeeName: string;
  userId?: number | null;
  businessUnitId?: number | null;
  departmentId?: number | null;
  departmentName?: string | null;
  positionId?: number | null;
  positionName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  residentRegistrationNumber?: string | null;
  hireDate?: string | null;
  resignDate?: string | null;
  isActive: boolean;
};

export type EmployeeForm = {
  employeeCode: string;
  employeeName: string;
  userId: string;
  businessUnitId: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  email: string;
  phone: string;
  address: string;
  residentRegistrationNumber: string;
  hireDate: string;
  resignDate: string;
  isActive: boolean;
};

export type EmployeeQuery = {
  page?: number;
  limit?: number;
  employeeId?: number;
  departmentId?: number;
  keyword?: string;
  isActive?: boolean;
};

export type EmployeeImportRowResult = {
  rowNo: number;
  status: "created" | "failed";
  employeeCode?: string | null;
  employeeName?: string | null;
  message: string;
};

export type EmployeeImportResult = {
  created: number;
  failed: number;
  items: EmployeeImportRowResult[];
};

export type EmployeeOrganizationHistory = {
  id: number;
  companyId: number;
  employeeId: number;
  businessUnitId?: number | null;
  businessUnitName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  positionId?: number | null;
  positionName?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent: boolean;
  changeReason?: string | null;
};
