import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  CertificateType,
  CertificateTypeForm,
  CertificateTypeQuery,
} from "../types/certificate-type.types";

const PATH = "/certificate-types";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: CertificateTypeForm) {
  return {
    ...(form.certificateTypeCode ? { certificateTypeCode: form.certificateTypeCode } : {}),
    certificateTypeName: form.certificateTypeName,
    issuer: form.issuer || undefined,
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getCertificateTypes(query: CertificateTypeQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<CertificateType>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createCertificateType(form: CertificateTypeForm) {
  return apiClient<CertificateType>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateCertificateType(id: number, form: CertificateTypeForm) {
  return apiClient<CertificateType>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteCertificateType(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
