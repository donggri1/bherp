export type ApiListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
};
