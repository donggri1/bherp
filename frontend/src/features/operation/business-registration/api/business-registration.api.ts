import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  BusinessRegistration,
  BusinessRegistrationForm,
  BusinessRegistrationQuery,
} from "../types/business-registration.types";

const PATH = "/business-registrations";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: BusinessRegistrationForm) {
  return {
    ...form,
    businessNumber: form.businessNumber || undefined,
    ceoName: form.ceoName || undefined,
    businessType: form.businessType || undefined,
    businessItem: form.businessItem || undefined,
    zipCode: form.zipCode || undefined,
    address: form.address || undefined,
    detailAddress: form.detailAddress || undefined,
    tel: form.tel || undefined,
    fax: form.fax || undefined,
    email: form.email || undefined,
  };
}

export function getBusinessRegistrations(query: BusinessRegistrationQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<BusinessRegistration>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createBusinessRegistration(form: BusinessRegistrationForm) {
  return apiClient<BusinessRegistration>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateBusinessRegistration(id: number, form: BusinessRegistrationForm) {
  return apiClient<BusinessRegistration>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteBusinessRegistration(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
