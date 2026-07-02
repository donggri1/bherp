export type CertificateType = {
  id: number;
  companyId: number;
  certificateTypeCode: string;
  certificateTypeName: string;
  issuer?: string;
  isActive: boolean;
  sortOrder: number;
};

export type CertificateTypeForm = {
  certificateTypeCode: string;
  certificateTypeName: string;
  issuer: string;
  isActive: boolean;
  sortOrder: string;
};

export type CertificateTypeQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
