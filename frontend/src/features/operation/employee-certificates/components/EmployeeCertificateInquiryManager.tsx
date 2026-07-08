"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
import { getCertificateTypes } from "@/features/operation/certificate-types/api/certificate-types.api";
import type { CertificateType } from "@/features/operation/certificate-types/types/certificate-type.types";
import { getEmployees } from "@/features/operation/employees/api/employees.api";
import type { Employee } from "@/features/operation/employees/types/employee.types";
import { cn } from "@/lib/utils";
import {
  getEmployeeCertificateExpiryStatus,
  getEmployeeCertificateInquiries,
} from "../api/employee-certificates.api";
import type { EmployeeCertificate } from "../types/employee-certificate.types";

function toDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateAfter(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function getExpiryStatus(expiredDate?: string) {
  const date = toDate(expiredDate);
  const baseClassName =
    "inline-flex h-5 items-center rounded-sm border px-1.5 text-[11px] font-medium";
  if (!date) {
    return {
      type: "missing" as const,
      label: "미입력",
      className: `${baseClassName} border-border bg-muted text-muted-foreground`,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      type: "expired" as const,
      label: `${Math.abs(diffDays)}일 경과`,
      className: `${baseClassName} border-destructive/30 bg-destructive/10 text-destructive`,
    };
  }
  if (diffDays === 0) {
    return {
      type: "upcoming" as const,
      label: "오늘 만료",
      className: `${baseClassName} border-amber-300 bg-amber-50 text-amber-700`,
    };
  }
  if (diffDays <= 30) {
    return {
      type: "upcoming" as const,
      label: `D-${diffDays}`,
      className: `${baseClassName} border-amber-300 bg-amber-50 text-amber-700`,
    };
  }
  return {
    type: "valid" as const,
    label: "유효",
    className: `${baseClassName} border-emerald-300 bg-emerald-50 text-emerald-700`,
  };
}

function getWorkHoursClassName(
  certificateTypeName?: string,
  workHours?: string,
) {
  const hours = Number(workHours);
  if (!certificateTypeName || !Number.isFinite(hours)) return "";
  if (certificateTypeName === "무정전" && hours >= 24)
    return "font-semibold text-blue-600";
  if (certificateTypeName === "지중배전" && hours >= 40)
    return "font-semibold text-blue-600";
  return "";
}

type EmployeeCertificateInquiryManagerProps = {
  mode?: "inquiry" | "expiry-status";
};

export function EmployeeCertificateInquiryManager({
  mode = "inquiry",
}: EmployeeCertificateInquiryManagerProps) {
  const router = useRouter();
  const expiryStatusMode = mode === "expiry-status";
  const [items, setItems] = useState<EmployeeCertificate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>(
    [],
  );
  const [employeeKeyword, setEmployeeKeyword] = useState("");
  const [certificateTypeIds, setCertificateTypeIds] = useState<number[]>([]);
  const [expiredDateFrom, setExpiredDateFrom] = useState("");
  const [expiredDateTo, setExpiredDateTo] = useState(() =>
    expiryStatusMode ? getDateAfter(30) : "",
  );
  const [isActive, setIsActive] = useState(() =>
    expiryStatusMode ? "true" : "",
  );
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const employeeMap = useMemo(
    () => new Map(employees.map((item) => [item.id, item])),
    [employees],
  );

  const certificateTypeMap = useMemo(
    () => new Map(certificateTypes.map((item) => [item.id, item])),
    [certificateTypes],
  );

  const filteredItems = useMemo(() => {
    const keyword = employeeKeyword.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const employee = employeeMap.get(item.employeeId);
      if (!employee) return false;
      return `${employee.employeeCode} ${employee.employeeName}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [employeeKeyword, employeeMap, items]);

  const resultSummary = useMemo(() => {
    const summary = {
      total: filteredItems.length,
      expired: 0,
      upcoming: 0,
      valid: 0,
      missing: 0,
    };

    for (const item of filteredItems) {
      const status = getExpiryStatus(item.expiredDate);
      if (status.type === "expired") summary.expired += 1;
      if (status.type === "upcoming") summary.upcoming += 1;
      if (status.type === "valid") summary.valid += 1;
      if (status.type === "missing") summary.missing += 1;
    }

    return summary;
  }, [filteredItems]);

  const searchSummary = useMemo(() => {
    const certificateTypeText = certificateTypeIds.length
      ? `${certificateTypeIds.length}개 자격증`
      : "전체 자격증";
    const dateText =
      expiredDateFrom || expiredDateTo
        ? `${expiredDateFrom || "시작일 없음"} ~ ${expiredDateTo || "종료일 없음"}`
        : "만료일 전체";
    const activeText =
      isActive === "" ? "전체" : isActive === "true" ? "사용" : "미사용";
    return `${certificateTypeText} · ${dateText} · ${activeText}`;
  }, [certificateTypeIds.length, expiredDateFrom, expiredDateTo, isActive]);

  const loadRefs = async () => {
    const [employeeResult, certificateTypeResult] = await Promise.all([
      getEmployees({ page: 1, limit: 100, isActive: true }),
      getCertificateTypes({ page: 1, limit: 100, isActive: true }),
    ]);
    setEmployees(employeeResult.items);
    setCertificateTypes(certificateTypeResult.items);
  };

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const query = {
        page: 1,
        limit: 100,
        certificateTypeIds: certificateTypeIds.length
          ? certificateTypeIds
          : undefined,
        expiredDateFrom: expiredDateFrom || undefined,
        expiredDateTo: expiredDateTo || undefined,
        isActive: isActive ? isActive === "true" : undefined,
      };
      const result = expiryStatusMode
        ? await getEmployeeCertificateExpiryStatus(query)
        : await getEmployeeCertificateInquiries(query);
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "조회에 실패했습니다.",
      );
      if (error instanceof Error && error.message.includes("로그인"))
        router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadRefs(), loadItems()]).catch((error) => {
      setMessage(
        error instanceof Error ? error.message : "초기 조회에 실패했습니다.",
      );
      if (error instanceof Error && error.message.includes("로그인"))
        router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCertificateTypeToggle = (certificateTypeId: number) => {
    setCertificateTypeIds((current) =>
      current.includes(certificateTypeId)
        ? current.filter((id) => id !== certificateTypeId)
        : [...current, certificateTypeId],
    );
  };

  return (
    <>
      <PageHeader
        title={expiryStatusMode ? "자격만료현황" : "사원자격증조회"}
        description={
          expiryStatusMode
            ? "만료되었거나 30일 이내 만료 예정인 사원 자격증을 확인합니다."
            : "자격증 종류와 만료일 기준으로 사원별 자격 보유 현황을 조회합니다."
        }
      />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(260px,1.4fr)_repeat(3,minmax(150px,1fr))]">
            <label className="space-y-2 text-sm font-medium">
              사원명/코드
              <Input
                placeholder="결과 내 빠른 검색"
                value={employeeKeyword}
                onChange={(event) => setEmployeeKeyword(event.target.value)}
              />
            </label>
            <div className="space-y-2 text-sm font-medium">
              <div>자격증 종류</div>
              <div className="max-h-28 overflow-auto rounded-md border border-input bg-background p-2">
                <label className="flex items-center gap-2 rounded px-1 py-1 text-sm font-normal">
                  <input
                    type="checkbox"
                    checked={!certificateTypeIds.length}
                    onChange={() => setCertificateTypeIds([])}
                  />
                  전체
                </label>
                {certificateTypes.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 rounded px-1 py-1 text-sm font-normal hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={certificateTypeIds.includes(item.id)}
                      onChange={() => handleCertificateTypeToggle(item.id)}
                    />
                    {item.certificateTypeName}
                  </label>
                ))}
              </div>
            </div>
            <label className="space-y-2 text-sm font-medium">
              만료일 시작
              <Input
                type="date"
                value={expiredDateFrom}
                onChange={(event) => setExpiredDateFrom(event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              만료일 종료
              <Input
                type="date"
                value={expiredDateTo}
                onChange={(event) => setExpiredDateTo(event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              사용여부
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={isActive}
                onChange={(event) => setIsActive(event.target.value)}
              >
                <option value="">전체</option>
                <option value="true">사용</option>
                <option value="false">미사용</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={loadItems} disabled={loading}>
              <Search className="size-4" aria-hidden />
              조회
            </Button>
          </div>
          <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            조회 기준: {searchSummary}
          </div>
        </CardContent>
      </Card>

      {message ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {expiryStatusMode ? "만료 현황" : "조회결과"}{" "}
            {filteredItems.length}건 / 전체 {total}건
          </CardTitle>
          <div className="grid gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">조회결과</div>
              <div className="mt-1 text-sm font-semibold tabular-nums">
                {resultSummary.total}
              </div>
            </div>
            <div className="rounded-md bg-destructive/10 px-3 py-2">
              <div className="text-xs text-destructive">만료</div>
              <div className="mt-1 text-sm font-semibold text-destructive tabular-nums">
                {resultSummary.expired}
              </div>
            </div>
            <div className="rounded-md bg-amber-50 px-3 py-2">
              <div className="text-xs text-amber-700">임박</div>
              <div className="mt-1 text-sm font-semibold text-amber-700 tabular-nums">
                {resultSummary.upcoming}
              </div>
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-2">
              <div className="text-xs text-emerald-700">유효</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700 tabular-nums">
                {resultSummary.valid}
              </div>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">미입력</div>
              <div className="mt-1 text-sm font-semibold tabular-nums">
                {resultSummary.missing}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[560px] overflow-auto p-0">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow>
                <TableHead>사원</TableHead>
                <TableHead>부서/직위</TableHead>
                <TableHead>자격증</TableHead>
                <TableHead>발급기관</TableHead>
                <TableHead>자격번호</TableHead>
                <TableHead>취득일</TableHead>
                <TableHead>갱신일</TableHead>
                <TableHead>만료일</TableHead>
                <TableHead>자격상태</TableHead>
                <TableHead className="text-right">실적시간</TableHead>
                <TableHead>메모</TableHead>
                <TableHead>만료상태</TableHead>
                <TableHead>사용여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length ? (
                filteredItems.map((item) => {
                  const employee = employeeMap.get(item.employeeId);
                  const certificateType = certificateTypeMap.get(
                    item.certificateTypeId,
                  );
                  const expiryStatus = getExpiryStatus(item.expiredDate);
                  const certificateTypeName =
                    certificateType?.certificateTypeName;

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        expiryStatusMode &&
                          expiryStatus.type === "expired" &&
                          "bg-destructive/5",
                        expiryStatusMode &&
                          expiryStatus.type === "upcoming" &&
                          "bg-amber-50/50",
                      )}
                    >
                      <TableCell>
                        <div className="whitespace-nowrap font-medium">
                          {employee?.employeeName ?? "-"}
                        </div>
                        <div className="whitespace-nowrap text-xs text-muted-foreground">
                          {employee?.employeeCode ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap">{employee?.departmentName ?? "-"}</div>
                        <div className="whitespace-nowrap text-xs text-muted-foreground">
                          {employee?.positionName ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {certificateType?.certificateTypeName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{certificateType?.issuer ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.certificateNo ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.acquiredDate ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.renewedDate ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.expiredDate ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.qualificationStatus ?? "-"}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          getWorkHoursClassName(
                            certificateTypeName,
                            item.workHours,
                          ),
                        )}
                      >
                        {item.workHours ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.memo ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={expiryStatus.className}>
                          {expiryStatus.label}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.isActive ? "사용" : "미사용"}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="h-24 text-center text-muted-foreground"
                  >
                    조회된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
