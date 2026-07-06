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
  createCertificateType,
  deleteCertificateType,
  getCertificateTypes,
  updateCertificateType,
} from "../api/certificate-types.api";
import type { CertificateType, CertificateTypeForm } from "../types/certificate-type.types";

const emptyForm: CertificateTypeForm = {
  certificateTypeCode: "",
  certificateTypeName: "",
  issuer: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: CertificateType): CertificateTypeForm {
  return {
    certificateTypeCode: item.certificateTypeCode,
    certificateTypeName: item.certificateTypeName,
    issuer: item.issuer ?? "",
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

export function CertificateTypesManager() {
  const router = useRouter();
  const [items, setItems] = useState<CertificateType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<CertificateTypeForm>(emptyForm);
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
      const result = await getCertificateTypes({
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

  const handleChange = <K extends keyof CertificateTypeForm>(
    key: K,
    value: CertificateTypeForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSelect = (item: CertificateType) => {
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
    if (!form.certificateTypeName.trim()) {
      setMessage("자격증명은 필수입니다.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateCertificateType(selectedId, form)
        : await createCertificateType(form);
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
    if (!window.confirm(`${selectedItem.certificateTypeName} 자격증 종류를 삭제할까요?`)) return;
    setLoading(true);
    setMessage("");
    try {
      await deleteCertificateType(selectedId);
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
      <PageHeader title="자격증종류등록" description="사원 자격증 기준정보를 등록하고 관리합니다." />
      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              검색어
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="코드, 자격증명, 발급기관" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사용여부
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" value={isActiveFilter} onChange={(event) => setIsActiveFilter(event.target.value)}>
                <option value="">전체</option>
                <option value="true">사용</option>
                <option value="false">미사용</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>
      <ActionButtons onSearch={loadItems} onNew={handleNew} onSave={handleSave} onDelete={handleDelete} searchDisabled={loading} newDisabled={loading} saveDisabled={loading} deleteDisabled={loading || !selectedId} />
      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="min-w-0">
          <CardHeader><CardTitle>목록</CardTitle></CardHeader>
          <CardContent className="max-h-[520px] overflow-auto p-0">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead>자격증코드</TableHead>
                  <TableHead>자격증명</TableHead>
                  <TableHead>발급기관</TableHead>
                  <TableHead>정렬순서</TableHead>
                  <TableHead>사용여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length ? items.map((item) => (
                  <TableRow key={item.id} className={cn("cursor-pointer", selectedId === item.id && "bg-muted")} onClick={() => handleSelect(item)}>
                    <TableCell className="whitespace-nowrap">{item.certificateTypeCode}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{item.certificateTypeName}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.issuer ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.sortOrder}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.isActive ? "사용" : "미사용"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">조회된 데이터가 없습니다.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>상세</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <label className="space-y-2 text-sm font-medium">자격증코드<Input value={form.certificateTypeCode} readOnly placeholder="저장 시 자동 생성" /></label>
            <label className="space-y-2 text-sm font-medium">자격증명<Input value={form.certificateTypeName} onChange={(event) => handleChange("certificateTypeName", event.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">발급기관<Input value={form.issuer} onChange={(event) => handleChange("issuer", event.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">정렬순서<Input type="number" value={form.sortOrder} onChange={(event) => handleChange("sortOrder", event.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} />사용</label>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
