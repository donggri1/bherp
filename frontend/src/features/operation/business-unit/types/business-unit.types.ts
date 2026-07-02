export type BusinessUnit = {
  id: number;
  companyId: number;
  businessUnitCode: string;
  businessUnitName: string;
  businessRegistrationId: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BusinessUnitForm = {
  businessUnitCode: string;
  businessUnitName: string;
  businessRegistrationId: string;
  isActive: boolean;
  sortOrder: string;
};

export type BusinessUnitQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
