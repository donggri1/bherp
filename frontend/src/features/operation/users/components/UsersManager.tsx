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
import { createUser, deleteUser, getUsers, updateUser } from "../api/users.api";
import type { ManagedUser, UserForm } from "../types/user-management.types";

const emptyForm: UserForm = {
  loginId: "",
  password: "",
  userName: "",
  email: "",
  phone: "",
  isActive: true,
};

function toForm(item: ManagedUser): UserForm {
  return {
    loginId: item.loginId,
    password: "",
    userName: item.userName,
    email: item.email ?? "",
    phone: item.phone ?? "",
    isActive: item.isActive,
  };
}

export function UsersManager() {
  const router = useRouter();
  const [items, setItems] = useState<ManagedUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getUsers({
        keyword,
        isActive: isActiveFilter === "" ? undefined : isActiveFilter === "true",
      });
      setItems(result.items);
      if (selectedId && !result.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setForm(emptyForm);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: ManagedUser) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    setMessage("");
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage("");
  };

  const handleSave = async () => {
    if (!form.loginId.trim() || !form.userName.trim()) {
      setMessage("로그인ID와 사용자명은 필수입니다.");
      return;
    }
    if (!selectedId && form.password.length < 8) {
      setMessage("신규 사용자는 8자 이상의 비밀번호가 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId ? await updateUser(selectedId, form) : await createUser(form);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("저장되었습니다.");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !selectedItem) {
      setMessage("삭제할 행을 선택하세요.");
      return;
    }
    if (!window.confirm(`${selectedItem.userName} 사용자를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteUser(selectedId);
      setSelectedId(null);
      setForm(emptyForm);
      setMessage("삭제되었습니다.");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="사용자등록" description="ERP 로그인 사용자를 등록하고 관리합니다." />
      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              검색어
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ID, 사용자명, 이메일"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사용여부
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={isActiveFilter}
                onChange={(event) => setIsActiveFilter(event.target.value)}
              >
                <option value="">전체</option>
                <option value="true">사용</option>
                <option value="false">미사용</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <ActionButtons
        onSearch={loadItems}
        onNew={handleNew}
        onSave={handleSave}
        onDelete={handleDelete}
        searchDisabled={loading}
        newDisabled={loading}
        saveDisabled={loading}
        deleteDisabled={loading || !selectedId}
      />

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>로그인ID</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>휴대폰</TableHead>
                  <TableHead>최근 로그인</TableHead>
                  <TableHead>사용여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length ? (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn("cursor-pointer", selectedId === item.id && "bg-muted")}
                      onClick={() => handleSelect(item)}
                    >
                      <TableCell>{item.loginId}</TableCell>
                      <TableCell className="font-medium">{item.userName}</TableCell>
                      <TableCell>{item.email ?? "-"}</TableCell>
                      <TableCell>{item.phone ?? "-"}</TableCell>
                      <TableCell>{item.lastLoginAt ? item.lastLoginAt.slice(0, 10) : "-"}</TableCell>
                      <TableCell>{item.isActive ? "사용" : "미사용"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      조회된 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>상세</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              로그인ID
              <Input value={form.loginId} onChange={(event) => handleChange("loginId", event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              비밀번호
              <Input
                type="password"
                value={form.password}
                placeholder={selectedId ? "변경할 때만 입력" : "8자 이상"}
                onChange={(event) => handleChange("password", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사용자명
              <Input value={form.userName} onChange={(event) => handleChange("userName", event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              이메일
              <Input value={form.email} onChange={(event) => handleChange("email", event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              휴대폰
              <Input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => handleChange("isActive", event.target.checked)}
              />
              사용
            </label>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
