export type EmployeeCertificate = {
  id: number;
  companyId: number;
  employeeId: number;
  certificateTypeId: number;
  certificateNo?: string;
  issuer?: string;
  acquiredDate?: string;
  expiredDate?: string;
  memo?: string;
  isActive: boolean;
};

export type EmployeeCertificateForm = {
  employeeId: string;
  certificateTypeId: string;
  certificateNo: string;
  acquiredDate: string;
  expiredDate: string;
  memo: string;
  isActive: boolean;
};

export type EmployeeCertificateQuery = {
  page?: number;
  limit?: number;
  employeeId?: number;
  certificateTypeId?: number;
  isActive?: boolean;
  expiredDateFrom?: string;
  expiredDateTo?: string;
};
