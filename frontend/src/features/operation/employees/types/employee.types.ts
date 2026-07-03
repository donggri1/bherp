export type Employee = {
  id: number;
  companyId: number;
  employeeCode: string;
  employeeName: string;
  userId?: number | null;
  businessUnitId?: number | null;
  departmentName?: string | null;
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
  departmentName: string;
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
  keyword?: string;
  isActive?: boolean;
};
