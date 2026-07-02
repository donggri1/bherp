"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ActionButtons } from "@/components/common/ActionButtons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createRole,
  deleteRole,
  getRoleMenuPermissions,
  getRoles,
  saveRoleMenuPermissions,
  updateRole,
} from "../api/permissions.api";
import type { Role, RoleForm, RoleMenuPermissionRow } from "../types/permission.types";

const emptyForm: RoleForm = {
  roleCode: "",
  roleName: "",
  description: "",
  isSystem: false,
  isActive: true,
};

function toForm(item: Role): RoleForm {
  return {
    roleCode: item.roleCode,
    roleName: item.roleName,
    description: item.description ?? "",
    isSystem: item.isSystem,
    isActive: item.isActive,
  };
}

export function PermissionsManager() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [permissionRows, setPermissionRows] = useState<RoleMenuPermissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRole = useMemo(
    () => roles.find((item) => item.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const loadRoles = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getRoles();
      setRoles(result.items);
      if (selectedRoleId && !result.items.some((item) => item.id === selectedRoleId)) {
        setSelectedRoleId(null);
        setForm(emptyForm);
        setPermissionRows([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "역할 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (roleId: number) => {
    setLoading(true);
    setMessage("");
    try {
      const rows = await getRoleMenuPermissions(roleId);
      setPermissionRows(rows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "권한 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (role: Role) => {
    setSelectedRoleId(role.id);
    setForm(toForm(role));
    void loadPermissions(role.id);
  };

  const handleNew = () => {
    setSelectedRoleId(null);
    setForm(emptyForm);
    setPermissionRows([]);
    setMessage("");
  };

  const handleChange = <K extends keyof RoleForm>(key: K, value: RoleForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePermissionChange = (
    menuId: number,
    key: keyof RoleMenuPermissionRow["permission"],
    value: boolean,
  ) => {
    setPermissionRows((current) =>
      current.map((row) =>
        row.permission.menuId === menuId
          ? { ...row, permission: { ...row.permission, [key]: value } }
          : row,
      ),
    );
  };

  const handleSave = async () => {
    if (!form.roleCode.trim() || !form.roleName.trim()) {
      setMessage("역할코드와 역할명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedRoleId
        ? await updateRole(selectedRoleId, form)
        : await createRole(form);
      setSelectedRoleId(saved.id);
      setForm(toForm(saved));
      await loadRoles();
      if (permissionRows.length) {
        await saveRoleMenuPermissions(
          saved.id,
          permissionRows.map((row) => row.permission),
        );
      } else {
        await loadPermissions(saved.id);
      }
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      setMessage("역할을 먼저 선택하세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const rows = await saveRoleMenuPermissions(
        selectedRoleId,
        permissionRows.map((row) => row.permission),
      );
      setPermissionRows(rows);
      setMessage("권한이 저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "권한 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoleId || !selectedRole) {
      setMessage("삭제할 역할을 선택하세요.");
      return;
    }
    if (!window.confirm(`${selectedRole.roleName} 역할을 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteRole(selectedRoleId);
      setSelectedRoleId(null);
      setForm(emptyForm);
      setPermissionRows([]);
      setMessage("삭제되었습니다.");
      await loadRoles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="권한등록" description="역할과 메뉴별 권한을 등록하고 관리합니다." />

      <ActionButtons
        onSearch={loadRoles}
        onNew={handleNew}
        onSave={handleSave}
        onDelete={handleDelete}
        searchDisabled={loading}
        newDisabled={loading}
        saveDisabled={loading}
        deleteDisabled={loading || !selectedRoleId}
      />

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>역할 목록</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roles.length ? (
                  roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between px-5 py-3 text-left text-sm hover:bg-muted/60",
                        selectedRoleId === role.id && "bg-muted",
                      )}
                      onClick={() => handleSelect(role)}
                    >
                      <span>
                        <span className="block font-medium">{role.roleName}</span>
                        <span className="text-muted-foreground">{role.roleCode}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {role.isActive ? "사용" : "미사용"}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    역할이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>역할 상세</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="space-y-2 text-sm font-medium">
                역할코드
                <Input value={form.roleCode} onChange={(event) => handleChange("roleCode", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                역할명
                <Input value={form.roleName} onChange={(event) => handleChange("roleName", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                설명
                <Input value={form.description} onChange={(event) => handleChange("description", event.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.isSystem} onChange={(event) => handleChange("isSystem", event.target.checked)} />
                시스템 역할
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} />
                사용
              </label>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>메뉴 권한</CardTitle>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              onClick={handleSavePermissions}
              disabled={loading || !selectedRoleId}
            >
              권한 저장
            </button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴그룹</TableHead>
                  <TableHead>메뉴</TableHead>
                  <TableHead>조회</TableHead>
                  <TableHead>등록</TableHead>
                  <TableHead>수정</TableHead>
                  <TableHead>삭제</TableHead>
                  <TableHead>엑셀</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionRows.length ? (
                  permissionRows.map((row) => (
                    <TableRow key={row.menu.id}>
                      <TableCell>{row.menu.menuGroupCode}</TableCell>
                      <TableCell className="font-medium">{row.menu.menuName}</TableCell>
                      {(["canRead", "canCreate", "canUpdate", "canDelete", "canExcel"] as const).map((key) => (
                        <TableCell key={key}>
                          <input
                            type="checkbox"
                            checked={row.permission[key]}
                            onChange={(event) =>
                              handlePermissionChange(row.permission.menuId, key, event.target.checked)
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      역할을 선택하세요.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
