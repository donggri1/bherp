export type BusinessRegistration = {
  id: number;
  companyId: number;
  businessCode: string;
  businessName: string;
  businessNumber?: string;
  ceoName?: string;
  businessType?: string;
  businessItem?: string;
  zipCode?: string;
  address?: string;
  detailAddress?: string;
  tel?: string;
  fax?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessRegistrationForm = {
  businessCode: string;
  businessName: string;
  businessNumber: string;
  ceoName: string;
  businessType: string;
  businessItem: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  tel: string;
  fax: string;
  email: string;
  isActive: boolean;
};

export type BusinessRegistrationQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
