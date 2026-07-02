import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type { ManagedUser, UserForm, UserQuery } from "../types/user-management.types";

const PATH = "/users";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: UserForm, isUpdate: boolean) {
  return {
    loginId: form.loginId,
    ...(form.password || !isUpdate ? { password: form.password } : {}),
    userName: form.userName,
    email: form.email || undefined,
    phone: form.phone || undefined,
    isActive: form.isActive,
  };
}

export function getUsers(query: UserQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  return apiClient<ApiList<ManagedUser>>(`${PATH}?${params.toString()}`, {
    accessToken: authToken(),
  });
}

export function createUser(form: UserForm) {
  return apiClient<ManagedUser>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form, false)),
  });
}

export function updateUser(id: number, form: UserForm) {
  return apiClient<ManagedUser>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form, true)),
  });
}

export function deleteUser(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}
