export type ManagedUser = {
  id: number;
  companyId: number;
  loginId: string;
  userName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
};

export type UserForm = {
  loginId: string;
  password: string;
  userName: string;
  email: string;
  phone: string;
  isActive: boolean;
};

export type UserQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  isActive?: boolean;
};
