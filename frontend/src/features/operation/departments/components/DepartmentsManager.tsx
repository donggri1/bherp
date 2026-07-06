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
import { getBusinessUnits } from "@/features/operation/business-unit/api/business-unit.api";
import type { BusinessUnit } from "@/features/operation/business-unit/types/business-unit.types";
import { cn } from "@/lib/utils";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../api/departments.api";
import type { Department, DepartmentForm } from "../types/department.types";

const emptyForm: DepartmentForm = {
  departmentCode: "",
  departmentName: "",
  businessUnitId: "",
  parentId: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: Department): DepartmentForm {
  return {
    departmentCode: item.departmentCode,
    departmentName: item.departmentName,
    businessUnitId: item.businessUnitId ? String(item.businessUnitId) : "",
    parentId: item.parentId ? String(item.parentId) : "",
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

export function DepartmentsManager() {
  const router = useRouter();
  const [items, setItems] = useState<Department[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const businessUnitMap = useMemo(
    () => new Map(businessUnits.map((item) => [item.id, item.businessUnitName])),
    [businessUnits],
  );

  const loadRefs = async () => {
    const result = await getBusinessUnits({ page: 1, limit: 100, isActive: true });
    setBusinessUnits(result.items);
  };

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getDepartments({
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
    void Promise.all([loadRefs(), loadItems()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof DepartmentForm>(key: K, value: DepartmentForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: Department) => {
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
    if (!form.departmentName.trim()) {
      setMessage("부서명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateDepartment(selectedId, form)
        : await createDepartment(form);
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
    if (!window.confirm(`${selectedItem.departmentName} 부서를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteDepartment(selectedId);
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
      <PageHeader title="부서등록" description="부서 정보를 등록하고 관리합니다." />
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
                placeholder="코드, 부서명"
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
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-auto p-0">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>부서코드</TableHead>
                  <TableHead>부서명</TableHead>
                  <TableHead>사업단위</TableHead>
                  <TableHead>정렬순서</TableHead>
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
                      <TableCell className="whitespace-nowrap">{item.departmentCode}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{item.departmentName}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.businessUnitId ? businessUnitMap.get(item.businessUnitId) ?? "-" : "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.sortOrder}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.isActive ? "사용" : "미사용"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
              부서코드
              <Input value={form.departmentCode} readOnly placeholder="저장 시 자동 생성" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              부서명
              <Input
                value={form.departmentName}
                onChange={(event) => handleChange("departmentName", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사업단위
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={form.businessUnitId}
                onChange={(event) => handleChange("businessUnitId", event.target.value)}
              >
                <option value="">선택 안 함</option>
                {businessUnits.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.businessUnitName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              상위부서
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={form.parentId}
                onChange={(event) => handleChange("parentId", event.target.value)}
              >
                <option value="">선택 안 함</option>
                {items
                  .filter((item) => item.id !== selectedId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.departmentName}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              정렬순서
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(event) => handleChange("sortOrder", event.target.value)}
              />
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
