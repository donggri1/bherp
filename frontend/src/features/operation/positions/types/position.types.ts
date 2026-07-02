export type Position = {
  id: number;
  companyId: number;
  positionCode: string;
  positionName: string;
  isActive: boolean;
  sortOrder: number;
};

export type PositionForm = {
  positionCode: string;
  positionName: string;
  isActive: boolean;
  sortOrder: string;
};

export type PositionQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
