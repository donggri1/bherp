"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, ShieldCheck, SquareCheckBig } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
  fetchAndUpsertDistributionWorkforce,
  getDistributionWorkforceEmployees,
  registerDistributionBaseCertificate,
} from "../api/distribution-workforce.api";
import type {
  DistributionWorkforceEmployee,
  DistributionWorkforceProcessItem,
} from "../types/distribution-workforce.types";

const BATCH_LIMIT = 5;

const TEST_PERIOD_FROM = "2025-01-01";

function defaultPeriodTo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusText(value?: string | null) {
  return value || "-";
}

function selectedIdsFromSet(value: Set<number>) {
  return Array.from(value);
}

export function DistributionWorkforceManager() {
  const router = useRouter();
  const [items, setItems] = useState<DistributionWorkforceEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("true");
  const [hasBaseCertificateFilter, setHasBaseCertificateFilter] = useState("");
  const [hasBaseCertificateNoFilter, setHasBaseCertificateNoFilter] = useState("");
  const [periodFrom, setPeriodFrom] = useState(TEST_PERIOD_FROM);
  const [periodTo, setPeriodTo] = useState(defaultPeriodTo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resultItems, setResultItems] = useState<DistributionWorkforceProcessItem[]>([]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );
  const selectedCount = selectedIds.size;

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getDistributionWorkforceEmployees({
        keyword,
        departmentName,
        isActive: isActiveFilter === "" ? undefined : isActiveFilter === "true",
        hasBaseCertificate:
          hasBaseCertificateFilter === "" ? undefined : hasBaseCertificateFilter === "true",
        hasBaseCertificateNo:
          hasBaseCertificateNoFilter === "" ? undefined : hasBaseCertificateNoFilter === "true",
        limit: 100,
      });
      setItems(result.items);
      setSelectedIds((current) => {
        const next = new Set<number>();
        const visibleIds = new Set(result.items.map((item) => item.id));
        current.forEach((id) => {
          if (visibleIds.has(id)) next.add(id);
        });
        return next;
      });
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

  const toggleSelected = (item: DistributionWorkforceEmployee) => {
    setMessage("");
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) {
        next.delete(item.id);
        return next;
      }
      if (next.size >= BATCH_LIMIT) {
        setMessage(`한 번에 최대 ${BATCH_LIMIT}명까지 선택할 수 있습니다.`);
        return next;
      }
      next.add(item.id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setResultItems([]);
    setMessage("");
  };

  const handleRegisterBaseCertificate = async () => {
    if (!selectedCount) {
      setMessage("사원을 선택하세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await registerDistributionBaseCertificate(selectedIdsFromSet(selectedIds));
      setResultItems(result.items);
      setMessage(`배전기능자격 등록: 생성 ${result.created}건, 중복 ${result.skipped}건, 실패 ${result.failed}건`);
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAndUpsert = async () => {
    if (!selectedCount) {
      setMessage("사원을 선택하세요.");
      return;
    }
    if (!periodFrom || !periodTo) {
      setMessage("조회기간을 입력하세요.");
      return;
    }
    const blocked = selectedItems.filter(
      (item) => !item.hasBaseCertificateNo || !item.birthDateAvailable,
    );
    if (blocked.length) {
      setMessage("자격번호 또는 생년월일이 없는 사원이 포함되어 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await fetchAndUpsertDistributionWorkforce(
        selectedIdsFromSet(selectedIds),
        periodFrom,
        periodTo,
      );
      setResultItems(result.items);
      setMessage(`배전기능정보 처리: 성공 ${result.success}건, 실패 ${result.failed}건`);
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "갱신에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="배전인력" description="배전기능자격과 KEPCO 배전기능인력 조회 상태를 관리합니다." />

      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <label className="space-y-2 text-sm font-medium xl:col-span-2">
              검색어
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="코드, 사원명, 부서" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              부서
              <Input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사용여부
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" value={isActiveFilter} onChange={(event) => setIsActiveFilter(event.target.value)}>
                <option value="">전체</option>
                <option value="true">사용</option>
                <option value="false">미사용</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              배전기능자격
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" value={hasBaseCertificateFilter} onChange={(event) => setHasBaseCertificateFilter(event.target.value)}>
                <option value="">전체</option>
                <option value="true">등록</option>
                <option value="false">미등록</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              자격번호
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" value={hasBaseCertificateNoFilter} onChange={(event) => setHasBaseCertificateNoFilter(event.target.value)}>
                <option value="">전체</option>
                <option value="true">입력</option>
                <option value="false">미입력</option>
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:w-[420px]">
            <label className="space-y-2 text-sm font-medium">
              조회 시작일
              <Input type="date" value={periodFrom} onChange={(event) => setPeriodFrom(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              조회 종료일
              <Input type="date" value={periodTo} onChange={(event) => setPeriodTo(event.target.value)} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">선택 {selectedCount}/{BATCH_LIMIT}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
            <Search className="size-4" aria-hidden />
            조회
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection} disabled={loading || !selectedCount}>
            <RotateCcw className="size-4" aria-hidden />
            선택 초기화
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegisterBaseCertificate} disabled={loading || !selectedCount}>
            <ShieldCheck className="size-4" aria-hidden />
            배전기능자격 등록
          </Button>
          <Button size="sm" onClick={handleFetchAndUpsert} disabled={loading || !selectedCount || !periodFrom || !periodTo}>
            <SquareCheckBig className="size-4" aria-hidden />
            배전기능정보등록및갱신
          </Button>
        </div>
      </div>

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>사원 목록</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-auto p-0">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-24 whitespace-nowrap">사원코드</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">사원명</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">부서</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">직위</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">휴대폰</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">배전기능자격</TableHead>
                  <TableHead className="w-36 whitespace-nowrap">자격번호</TableHead>
                  <TableHead className="w-20 whitespace-nowrap">생년월일</TableHead>
                  <TableHead className="w-28 whitespace-nowrap">무정전</TableHead>
                  <TableHead className="w-28 whitespace-nowrap">지중배전</TableHead>
                  <TableHead className="w-24 whitespace-nowrap">최근 조회</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length ? (
                  items.map((item) => {
                    const checked = selectedIds.has(item.id);
                    return (
                      <TableRow key={item.id} className={cn("cursor-pointer", checked && "bg-muted")} onClick={() => toggleSelected(item)}>
                        <TableCell className="text-center">
                          <input type="checkbox" checked={checked} onChange={() => toggleSelected(item)} onClick={(event) => event.stopPropagation()} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{item.employeeCode}</TableCell>
                        <TableCell className="whitespace-nowrap font-medium">{item.employeeName}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.departmentName ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.positionName ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.phone ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.hasBaseCertificate ? "등록" : "미등록"}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.hasBaseCertificateNo ? (item.baseCertificateNo ?? item.baseCertificateNoMasked ?? "입력") : "미입력"}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.birthDateAvailable ? "가능" : "불가"}</TableCell>
                        <TableCell className="whitespace-nowrap">{statusText(item.noOutageStatus)}</TableCell>
                        <TableCell className="whitespace-nowrap">{statusText(item.undergroundStatus)}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.lastFetchedAt ? item.lastFetchedAt.slice(0, 10) : "-"}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
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
            <CardTitle>처리 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultItems.length ? (
              resultItems.map((item, index) => (
                <div key={`${item.employeeId}-${index}`} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.employeeName ?? item.employeeId}</span>
                    <span className={cn("text-xs font-medium", item.status === "failed" ? "text-destructive" : "text-primary")}>{item.status}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{item.message}</div>
                  {item.qualifications?.length ? (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {item.qualifications.map((qualification) => (
                        <div key={qualification.qualificationName}>
                          {qualification.qualificationName} / {qualification.certificateNo ?? "-"} / {qualification.qualificationStatus ?? "-"}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">처리 결과가 없습니다.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
