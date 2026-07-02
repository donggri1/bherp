import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type { Employee, EmployeeForm, EmployeeQuery } from "../types/employee.types";

const PATH = "/employees";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: EmployeeForm) {
  return {
    ...(form.employeeCode ? { employeeCode: form.employeeCode } : {}),
    employeeName: form.employeeName,
    userId: form.userId ? Number(form.userId) : undefined,
    businessUnitId: form.businessUnitId ? Number(form.businessUnitId) : undefined,
    departmentName: form.departmentName || undefined,
    positionName: form.positionName || undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    hireDate: form.hireDate || undefined,
    resignDate: form.resignDate || undefined,
    isActive: form.isActive,
  };
}

export function getEmployees(query: EmployeeQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<Employee>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createEmployee(form: EmployeeForm) {
  return apiClient<Employee>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateEmployee(id: number, form: EmployeeForm) {
  return apiClient<Employee>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteEmployee(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
