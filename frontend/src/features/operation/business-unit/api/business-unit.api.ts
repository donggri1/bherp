import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  BusinessUnit,
  BusinessUnitForm,
  BusinessUnitQuery,
} from "../types/business-unit.types";

const PATH = "/business-units";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: BusinessUnitForm) {
  return {
    businessUnitCode: form.businessUnitCode,
    businessUnitName: form.businessUnitName,
    businessRegistrationId: Number(form.businessRegistrationId),
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getBusinessUnits(query: BusinessUnitQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<BusinessUnit>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createBusinessUnit(form: BusinessUnitForm) {
  return apiClient<BusinessUnit>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updateBusinessUnit(id: number, form: BusinessUnitForm) {
  return apiClient<BusinessUnit>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteBusinessUnit(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
