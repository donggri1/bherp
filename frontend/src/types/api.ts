export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
};

export type ApiList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
