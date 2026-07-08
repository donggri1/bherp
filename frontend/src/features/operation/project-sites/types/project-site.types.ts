import type { Project } from "@/features/operation/projects/types/project.types";

export type ProjectSiteStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type ProjectSite = {
  id: number;
  companyId: number;
  siteCode: string;
  projectId: number;
  project?: Project;
  siteName: string;
  siteAddress?: string | null;
  managerName?: string | null;
  managerPhone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  siteStatus: ProjectSiteStatus;
  memo?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSiteForm = {
  siteCode: string;
  projectId: string;
  siteName: string;
  siteAddress: string;
  managerName: string;
  managerPhone: string;
  startDate: string;
  endDate: string;
  siteStatus: ProjectSiteStatus;
  memo: string;
  isActive: boolean;
  sortOrder: string;
};

export type ProjectSiteQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  projectId?: number;
  siteStatus?: ProjectSiteStatus;
  isActive?: boolean;
};
