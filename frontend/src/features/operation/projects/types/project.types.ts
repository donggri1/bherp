export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type Project = {
  id: number;
  companyId: number;
  projectCode: string;
  constructionNo?: string | null;
  projectName: string;
  clientName?: string | null;
  siteAddress?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  projectStatus: ProjectStatus;
  memo?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectForm = {
  projectCode: string;
  constructionNo: string;
  projectName: string;
  clientName: string;
  siteAddress: string;
  startDate: string;
  endDate: string;
  projectStatus: ProjectStatus;
  memo: string;
  isActive: boolean;
  sortOrder: string;
};

export type ProjectQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  projectStatus?: ProjectStatus;
  isActive?: boolean;
};
