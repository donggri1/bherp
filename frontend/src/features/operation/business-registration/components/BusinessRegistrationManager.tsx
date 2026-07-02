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
  createBusinessRegistration,
  deleteBusinessRegistration,
  getBusinessRegistrations,
  updateBusinessRegistration,
} from "../api/business-registration.api";
import type {
  BusinessRegistration,
  BusinessRegistrationForm,
} from "../types/business-registration.types";

const emptyForm: BusinessRegistrationForm = {
  businessCode: "",
  businessName: "",
  businessNumber: "",
  ceoName: "",
  businessType: "",
  businessItem: "",
  zipCode: "",
  address: "",
  detailAddress: "",
  tel: "",
  fax: "",
  email: "",
  isActive: true,
};

function toForm(item: BusinessRegistration): BusinessRegistrationForm {
  return {
    businessCode: item.businessCode,
    businessName: item.businessName,
    businessNumber: item.businessNumber ?? "",
    ceoName: item.ceoName ?? "",
    businessType: item.businessType ?? "",
    businessItem: item.businessItem ?? "",
    zipCode: item.zipCode ?? "",
    address: item.address ?? "",
    detailAddress: item.detailAddress ?? "",
    tel: item.tel ?? "",
    fax: item.fax ?? "",
    email: item.email ?? "",
    isActive: item.isActive,
  };
}

export function BusinessRegistrationManager() {
  const router = useRouter();
  const [items, setItems] = useState<BusinessRegistration[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<BusinessRegistrationForm>(emptyForm);
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
      const result = await getBusinessRegistrations({
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

  const handleChange = <K extends keyof BusinessRegistrationForm>(
    key: K,
    value: BusinessRegistrationForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: BusinessRegistration) => {
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
    if (!form.businessCode.trim() || !form.businessName.trim()) {
      setMessage("사업자코드와 사업자명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateBusinessRegistration(selectedId, form)
        : await createBusinessRegistration(form);
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
    if (!window.confirm(`${selectedItem.businessName} 정보를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteBusinessRegistration(selectedId);
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
      <PageHeader title="사업자등록" description="사업자 정보를 등록하고 관리합니다." />

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
                placeholder="코드, 사업자명, 사업자번호"
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
        <Card>
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사업자코드</TableHead>
                  <TableHead>사업자명</TableHead>
                  <TableHead>사업자번호</TableHead>
                  <TableHead>대표자</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>사용여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length ? (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "cursor-pointer",
                        selectedId === item.id && "bg-muted",
                      )}
                      onClick={() => handleSelect(item)}
                    >
                      <TableCell>{item.businessCode}</TableCell>
                      <TableCell className="font-medium">{item.businessName}</TableCell>
                      <TableCell>{item.businessNumber ?? "-"}</TableCell>
                      <TableCell>{item.ceoName ?? "-"}</TableCell>
                      <TableCell>{item.tel ?? "-"}</TableCell>
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
              사업자코드
              <Input
                value={form.businessCode}
                onChange={(event) => handleChange("businessCode", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사업자명
              <Input
                value={form.businessName}
                onChange={(event) => handleChange("businessName", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사업자번호
              <Input
                value={form.businessNumber}
                onChange={(event) => handleChange("businessNumber", event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              대표자
              <Input
                value={form.ceoName}
                onChange={(event) => handleChange("ceoName", event.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                업태
                <Input
                  value={form.businessType}
                  onChange={(event) => handleChange("businessType", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                종목
                <Input
                  value={form.businessItem}
                  onChange={(event) => handleChange("businessItem", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                전화번호
                <Input value={form.tel} onChange={(event) => handleChange("tel", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                팩스
                <Input value={form.fax} onChange={(event) => handleChange("fax", event.target.value)} />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              이메일
              <Input
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <label className="space-y-2 text-sm font-medium">
                우편번호
                <Input
                  value={form.zipCode}
                  onChange={(event) => handleChange("zipCode", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                주소
                <Input
                  value={form.address}
                  onChange={(event) => handleChange("address", event.target.value)}
                />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              상세주소
              <Input
                value={form.detailAddress}
                onChange={(event) => handleChange("detailAddress", event.target.value)}
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
