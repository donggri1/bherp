import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  EmployeeCertificate,
  EmployeeCertificateForm,
  EmployeeCertificateQuery,
} from "../types/employee-certificate.types";

const PATH = "/employee-certificates";
const INQUIRY_PATH = "/employee-certificate-inquiries";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: EmployeeCertificateForm) {
  return {
    employeeId: Number(form.employeeId),
    certificateTypeId: Number(form.certificateTypeId),
    certificateNo: form.certificateNo || undefined,
    acquiredDate: form.acquiredDate || undefined,
    renewedDate: form.renewedDate || undefined,
    expiredDate: form.expiredDate || undefined,
    qualificationStatus: form.qualificationStatus || undefined,
    workHours: form.workHours || undefined,
    memo: form.memo || undefined,
    isActive: form.isActive,
  };
}

export function getEmployeeCertificates(query: EmployeeCertificateQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.employeeId) params.set("employeeId", String(query.employeeId));
  if (query.certificateTypeId)
    params.set("certificateTypeId", String(query.certificateTypeId));
  if (query.isActive !== undefined)
    params.set("isActive", String(query.isActive));
  if (query.expiredDateFrom)
    params.set("expiredDateFrom", query.expiredDateFrom);
  if (query.expiredDateTo) params.set("expiredDateTo", query.expiredDateTo);

  return apiClient<ApiList<EmployeeCertificate>>(
    `${PATH}?${params.toString()}`,
    {
      accessToken: authToken(),
    },
  );
}

export function getEmployeeCertificateInquiries(
  query: EmployeeCertificateQuery = {},
) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 100));
  if (query.employeeId) params.set("employeeId", String(query.employeeId));
  if (query.certificateTypeId)
    params.set("certificateTypeId", String(query.certificateTypeId));
  if (query.isActive !== undefined)
    params.set("isActive", String(query.isActive));
  if (query.expiredDateFrom)
    params.set("expiredDateFrom", query.expiredDateFrom);
  if (query.expiredDateTo) params.set("expiredDateTo", query.expiredDateTo);

  return apiClient<ApiList<EmployeeCertificate>>(
    `${INQUIRY_PATH}?${params.toString()}`,
    {
      accessToken: authToken(),
    },
  );
}

export function createEmployeeCertificate(form: EmployeeCertificateForm) {
  return apiClient<EmployeeCertificate>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateEmployeeCertificate(
  id: number,
  form: EmployeeCertificateForm,
) {
  return apiClient<EmployeeCertificate>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteEmployeeCertificate(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
