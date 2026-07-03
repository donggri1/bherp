export type EmployeeCertificate = {
  id: number;
  companyId: number;
  employeeId: number;
  certificateTypeId: number;
  certificateNo?: string;
  issuer?: string;
  acquiredDate?: string;
  renewedDate?: string;
  expiredDate?: string;
  qualificationStatus?: string;
  workHours?: string;
  memo?: string;
  isActive: boolean;
};

export type EmployeeCertificateForm = {
  employeeId: string;
  certificateTypeId: string;
  certificateNo: string;
  acquiredDate: string;
  renewedDate: string;
  expiredDate: string;
  qualificationStatus: string;
  workHours: string;
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
