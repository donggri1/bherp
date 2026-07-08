import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  ProjectAssignment,
  ProjectAssignmentForm,
  ProjectAssignmentQuery,
} from "../types/project-assignment.types";

const PATH = "/project-assignments";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toPayload(form: ProjectAssignmentForm) {
  return {
    projectId: Number(form.projectId),
    projectSiteId: form.projectSiteId ? Number(form.projectSiteId) : null,
    employeeId: Number(form.employeeId),
    assignmentRole: nullableText(form.assignmentRole),
    startDate: form.startDate,
    endDate: form.endDate || null,
    assignmentStatus: form.assignmentStatus,
    memo: nullableText(form.memo),
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getProjectAssignments(query: ProjectAssignmentQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.projectId) params.set("projectId", String(query.projectId));
  if (query.projectSiteId) params.set("projectSiteId", String(query.projectSiteId));
  if (query.employeeId) params.set("employeeId", String(query.employeeId));
  if (query.assignmentStatus) params.set("assignmentStatus", query.assignmentStatus);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<ProjectAssignment>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createProjectAssignment(form: ProjectAssignmentForm) {
  return apiClient<ProjectAssignment>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateProjectAssignment(id: number, form: ProjectAssignmentForm) {
  return apiClient<ProjectAssignment>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteProjectAssignment(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
