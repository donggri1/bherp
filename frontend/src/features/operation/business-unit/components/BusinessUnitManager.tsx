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
import { getBusinessRegistrations } from "@/features/operation/business-registration/api/business-registration.api";
import type { BusinessRegistration } from "@/features/operation/business-registration/types/business-registration.types";
import { cn } from "@/lib/utils";
import {
  createBusinessUnit,
  deleteBusinessUnit,
  getBusinessUnits,
  updateBusinessUnit,
} from "../api/business-unit.api";
import type { BusinessUnit, BusinessUnitForm } from "../types/business-unit.types";

const emptyForm: BusinessUnitForm = {
  businessUnitCode: "",
  businessUnitName: "",
  businessRegistrationId: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: BusinessUnit): BusinessUnitForm {
  return {
    businessUnitCode: item.businessUnitCode,
    businessUnitName: item.businessUnitName,
    businessRegistrationId: String(item.businessRegistrationId),
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

export function BusinessUnitManager() {
  const router = useRouter();
  const [items, setItems] = useState<BusinessUnit[]>([]);
  const [businessRegistrations, setBusinessRegistrations] = useState<BusinessRegistration[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<BusinessUnitForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const businessRegistrationMap = useMemo(
    () =>
      new Map(
        businessRegistrations.map((item) => [
          item.id,
          `${item.businessName} (${item.businessCode})`,
        ]),
      ),
    [businessRegistrations],
  );

  const loadBusinessRegistrations = async () => {
    const result = await getBusinessRegistrations({ page: 1, limit: 100, isActive: true });
    setBusinessRegistrations(result.items);
  };

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getBusinessUnits({
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
    void Promise.all([loadBusinessRegistrations(), loadItems()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof BusinessUnitForm>(
    key: K,
    value: BusinessUnitForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: BusinessUnit) => {
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
    if (
      !form.businessUnitCode.trim() ||
      !form.businessUnitName.trim() ||
      !form.businessRegistrationId
    ) {
      setMessage("사업단위코드, 사업단위명, 사업자는 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateBusinessUnit(selectedId, form)
        : await createBusinessUnit(form);
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
    if (!window.confirm(`${selectedItem.businessUnitName} 정보를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteBusinessUnit(selectedId);
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
      <PageHeader title="사업단위등록" description="사업단위 정보를 등록하고 관리합니다." />

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
                placeholder="코드, 사업단위명"
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

      {message ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-auto p-0">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>사업단위코드</TableHead>
                  <TableHead>사업단위명</TableHead>
                  <TableHead>사업자</TableHead>
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
                      <TableCell className="whitespace-nowrap">{item.businessUnitCode}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{item.businessUnitName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {businessRegistrationMap.get(item.businessRegistrationId) ?? "-"}
                      </TableCell>
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
              사업단위코드
              <Input
                value={form.businessUnitCode}
                onChange={(event) => handleChange("businessUnitCode", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사업단위명
              <Input
                value={form.businessUnitName}
                onChange={(event) => handleChange("businessUnitName", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사업자
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={form.businessRegistrationId}
                onChange={(event) => handleChange("businessRegistrationId", event.target.value)}
              >
                <option value="">선택</option>
                {businessRegistrations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.businessName} ({item.businessCode})
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
