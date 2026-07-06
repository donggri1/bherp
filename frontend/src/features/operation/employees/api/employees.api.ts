import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList, ApiResponse } from "@/types/api";
import type {
  Employee,
  EmployeeForm,
  EmployeeImportResult,
  EmployeeQuery,
} from "../types/employee.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
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
    userId: form.userId ? Number(form.userId) : null,
    businessUnitId: form.businessUnitId ? Number(form.businessUnitId) : null,
    departmentName: form.departmentName || null,
    positionName: form.positionName || null,
    email: form.email || null,
    phone: form.phone || null,
    address: form.address || null,
    residentRegistrationNumber: form.residentRegistrationNumber || null,
    hireDate: form.hireDate || null,
    resignDate: form.resignDate || null,
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

export async function downloadEmployeeImportTemplate() {
  const response = await fetch(`${API_BASE_URL}${PATH}/excel-template`, {
    headers: {
      Authorization: `Bearer ${authToken()}`,
    },
  });

  if (response.status === 401) throw new Error("인증이 만료되었습니다.");
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new Error(payload?.message ?? "사원등록 양식 다운로드에 실패했습니다.");
  }

  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get("content-disposition")),
  };
}

export async function importEmployeesFromExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}${PATH}/excel-import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken()}`,
    },
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<EmployeeImportResult>
    | null;

  if (response.status === 401) throw new Error("인증이 만료되었습니다.");
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "사원 엑셀 등록에 실패했습니다.");
  }

  return payload.data;
}

function parseFileName(contentDisposition: string | null) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  const plain = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1];
  return plain ?? "사원등록_양식.xlsx";
}
