import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type { Position, PositionForm, PositionQuery } from "../types/position.types";

const PATH = "/positions";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: PositionForm) {
  return {
    ...(form.positionCode ? { positionCode: form.positionCode } : {}),
    positionName: form.positionName,
    isActive: form.isActive,
    sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
  };
}

export function getPositions(query: PositionQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<Position>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createPosition(form: PositionForm) {
  return apiClient<Position>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function updatePosition(id: number, form: PositionForm) {
  return apiClient<Position>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deletePosition(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
