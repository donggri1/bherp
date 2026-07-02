export type Employee = {
  id: number;
  companyId: number;
  employeeCode: string;
  employeeName: string;
  userId?: number;
  businessUnitId?: number;
  departmentName?: string;
  positionName?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  resignDate?: string;
  isActive: boolean;
};

export type EmployeeForm = {
  employeeCode: string;
  employeeName: string;
  userId: string;
  businessUnitId: string;
  departmentName: string;
  positionName: string;
  email: string;
  phone: string;
  hireDate: string;
  resignDate: string;
  isActive: boolean;
};

export type EmployeeQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
