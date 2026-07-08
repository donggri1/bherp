import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  ProjectSite,
  ProjectSiteForm,
  ProjectSiteQuery,
} from "../types/project-site.types";

const PATH = "/project-sites";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toPayload(form: ProjectSiteForm) {
  return {
    ...(form.siteCode.trim() ? { siteCode: form.siteCode.trim() } : {}),
    projectId: Number(form.projectId),
    siteName: form.siteName.trim(),
    siteAddress: nullableText(form.siteAddress),
    managerName: nullableText(form.managerName),
    managerPhone: nullableText(form.managerPhone),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    siteStatus: form.siteStatus,
    memo: nullableText(form.memo),
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getProjectSites(query: ProjectSiteQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.projectId) params.set("projectId", String(query.projectId));
  if (query.siteStatus) params.set("siteStatus", query.siteStatus);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<ProjectSite>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createProjectSite(form: ProjectSiteForm) {
  return apiClient<ProjectSite>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateProjectSite(id: number, form: ProjectSiteForm) {
  return apiClient<ProjectSite>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteProjectSite(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
