export type HrDashboardSummary = {
  totalEmployees: number;
  activeEmployees: number;
  resignedEmployees: number;
  activeCertificates: number;
  expiringCertificates: number;
  expiredCertificates: number;
  expiryDays: number;
  today: string;
  expiryDateTo: string;
};

export type DepartmentHeadcount = {
  departmentName: string;
  totalCount: number;
  activeCount: number;
  resignedCount: number;
};

export type CertificateExpiryItem = {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName?: string | null;
  positionName?: string | null;
  certificateTypeId: number;
  certificateTypeName: string;
  certificateNo?: string | null;
  expiredDate?: string | null;
  daysUntilExpiry?: number | null;
  status: "expired" | "expiring";
};

export type HrDashboard = {
  summary: HrDashboardSummary;
  departmentHeadcounts: DepartmentHeadcount[];
  certificateExpiryItems: CertificateExpiryItem[];
};
