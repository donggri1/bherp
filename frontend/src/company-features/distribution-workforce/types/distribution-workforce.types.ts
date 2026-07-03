export type DistributionWorkforceEmployee = {
  id: number;
  employeeCode: string;
  employeeName: string;
  departmentName?: string | null;
  positionName?: string | null;
  phone?: string | null;
  hasBaseCertificate: boolean;
  hasBaseCertificateNo: boolean;
  baseCertificateNoMasked?: string | null;
  birthDateAvailable: boolean;
  birthDateSource?: "residentRegistrationNumber";
  noOutageStatus?: string | null;
  noOutageLastFetchedAt?: string | null;
  undergroundStatus?: string | null;
  undergroundLastFetchedAt?: string | null;
  lastFetchedAt?: string | null;
};

export type DistributionWorkforceQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  departmentName?: string;
  isActive?: boolean;
  hasBaseCertificate?: boolean;
  hasBaseCertificateNo?: boolean;
};

export type DistributionWorkforceProcessItem = {
  employeeId: number;
  employeeName?: string;
  status: string;
  message: string;
  qualifications?: Array<{
    qualificationName: string;
    certificateNo?: string | null;
    qualificationStatus?: string | null;
  }>;
};

export type RegisterBaseCertificateResult = {
  created: number;
  skipped: number;
  failed: number;
  items: DistributionWorkforceProcessItem[];
};

export type FetchAndUpsertResult = {
  success: number;
  failed: number;
  items: DistributionWorkforceProcessItem[];
};
