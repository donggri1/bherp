import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type { Project, ProjectForm, ProjectQuery } from "../types/project.types";

const PATH = "/projects";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toPayload(form: ProjectForm) {
  return {
    ...(form.projectCode.trim() ? { projectCode: form.projectCode.trim() } : {}),
    constructionNo: nullableText(form.constructionNo),
    projectName: form.projectName.trim(),
    clientName: nullableText(form.clientName),
    siteAddress: nullableText(form.siteAddress),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    projectStatus: form.projectStatus,
    memo: nullableText(form.memo),
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getProjects(query: ProjectQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.projectStatus) params.set("projectStatus", query.projectStatus);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<Project>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createProject(form: ProjectForm) {
  return apiClient<Project>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateProject(id: number, form: ProjectForm) {
  return apiClient<Project>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteProject(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
