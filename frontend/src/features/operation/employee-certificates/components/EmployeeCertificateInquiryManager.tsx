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
  if (!date) return { label: "-", className: "text-muted-foreground" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0)
    return { label: "만료", className: "text-destructive font-medium" };
  if (diffDays <= 30)
    return {
      label: `${diffDays}일 남음`,
      className: "text-amber-600 font-medium",
    };
  return { label: "유효", className: "text-emerald-700 font-medium" };
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
                    <TableRow key={item.id}>
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
                      <TableCell className={cn("whitespace-nowrap", expiryStatus.className)}>
                        {expiryStatus.label}
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
