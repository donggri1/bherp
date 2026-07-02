import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type { Department, DepartmentForm, DepartmentQuery } from "../types/department.types";

const PATH = "/departments";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: DepartmentForm) {
  return {
    ...(form.departmentCode ? { departmentCode: form.departmentCode } : {}),
    departmentName: form.departmentName,
    businessUnitId: form.businessUnitId ? Number(form.businessUnitId) : undefined,
    parentId: form.parentId ? Number(form.parentId) : undefined,
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getDepartments(query: DepartmentQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<Department>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createDepartment(form: DepartmentForm) {
  return apiClient<Department>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateDepartment(id: number, form: DepartmentForm) {
  return apiClient<Department>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteDepartment(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
