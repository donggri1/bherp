import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  Role,
  RoleForm,
  RoleMenuPermission,
  RoleMenuPermissionRow,
} from "../types/permission.types";

const PATH = "/roles";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function toPayload(form: RoleForm) {
  return {
    roleCode: form.roleCode,
    roleName: form.roleName,
    description: form.description || undefined,
    isSystem: form.isSystem,
    isActive: form.isActive,
  };
}

export function getRoles() {
  return apiClient<ApiList<Role>>(`${PATH}?page=1&limit=100`, {
    accessToken: authToken(),
  });
}

export function createRole(form: RoleForm) {
  return apiClient<Role>(PATH, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function copyRole(id: number) {
  return apiClient<Role>(`${PATH}/${id}/copy`, {
    method: "POST",
    accessToken: authToken(),
  });
}

export function updateRole(id: number, form: RoleForm) {
  return apiClient<Role>(`${PATH}/${id}`, {
    method: "PATCH",
    accessToken: authToken(),
    body: JSON.stringify(toPayload(form)),
  });
}

export function deleteRole(id: number) {
  return apiClient<{ affected?: number }>(`${PATH}/${id}`, {
    method: "DELETE",
    accessToken: authToken(),
  });
}

export function getRoleMenuPermissions(roleId: number) {
  return apiClient<RoleMenuPermissionRow[]>(`${PATH}/${roleId}/menu-permissions`, {
    accessToken: authToken(),
  });
}

export function saveRoleMenuPermissions(
  roleId: number,
  permissions: RoleMenuPermission[],
) {
  return apiClient<RoleMenuPermissionRow[]>(`${PATH}/${roleId}/menu-permissions`, {
    method: "PUT",
    accessToken: authToken(),
    body: JSON.stringify({ permissions }),
  });
}
