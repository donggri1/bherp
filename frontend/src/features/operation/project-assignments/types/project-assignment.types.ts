import type { Employee } from "@/features/operation/employees/types/employee.types";
import type { ProjectSite } from "@/features/operation/project-sites/types/project-site.types";
import type { Project } from "@/features/operation/projects/types/project.types";

export type ProjectAssignmentStatus = "planned" | "assigned" | "completed" | "cancelled";

export type ProjectAssignment = {
  id: number;
  companyId: number;
  projectId: number;
  project?: Project;
  projectSiteId?: number | null;
  projectSite?: ProjectSite | null;
  employeeId: number;
  employee?: Employee;
  assignmentRole?: string | null;
  startDate: string;
  endDate?: string | null;
  assignmentStatus: ProjectAssignmentStatus;
  memo?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectAssignmentForm = {
  projectId: string;
  projectSiteId: string;
  employeeId: string;
  assignmentRole: string;
  startDate: string;
  endDate: string;
  assignmentStatus: ProjectAssignmentStatus;
  memo: string;
  isActive: boolean;
  sortOrder: string;
};

export type ProjectAssignmentQuery = {
  page?: number;
  limit?: number;
  keyword?: string;
  projectId?: number;
  projectSiteId?: number;
  employeeId?: number;
  assignmentStatus?: ProjectAssignmentStatus;
  isActive?: boolean;
};
