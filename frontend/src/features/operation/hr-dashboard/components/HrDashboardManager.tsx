"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  RefreshCw,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getHrDashboard } from "../api/hr-dashboard.api";
import type { CertificateExpiryItem, HrDashboard } from "../types/hr-dashboard.types";

const expiryDayOptions = [7, 30, 60, 90];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function dateLabel(value?: string | null) {
  return value ?? "-";
}

function expiryLabel(item: CertificateExpiryItem) {
  const days = item.daysUntilExpiry;
  if (days === null || days === undefined) return "-";
  if (days < 0) return `${Math.abs(days)}일 경과`;
  if (days === 0) return "오늘";
  return `D-${days}`;
}

export function HrDashboardManager() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<HrDashboard | null>(null);
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = async (nextExpiryDays = expiryDays) => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getHrDashboard({ expiryDays: nextExpiryDays });
      setDashboard(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("인증")) router.push("/login");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpiItems = useMemo(() => {
    const summary = dashboard?.summary;
    return [
      {
        title: "전체 사원",
        value: summary?.totalEmployees ?? 0,
        caption: "등록 기준",
        icon: Users,
        tone: "border-slate-200 bg-slate-50 text-slate-700",
      },
      {
        title: "재직",
        value: summary?.activeEmployees ?? 0,
        caption: "사용 및 퇴사일 없음",
        icon: UserCheck,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
      {
        title: "퇴사",
        value: summary?.resignedEmployees ?? 0,
        caption: "퇴사일 기준",
        icon: UserX,
        tone: "border-zinc-200 bg-zinc-50 text-zinc-700",
      },
      {
        title: `${summary?.expiryDays ?? expiryDays}일 이내 만료`,
        value: summary?.expiringCertificates ?? 0,
        caption: "사용 자격증",
        icon: CalendarClock,
        tone: "border-amber-200 bg-amber-50 text-amber-700",
      },
      {
        title: "이미 만료",
        value: summary?.expiredCertificates ?? 0,
        caption: "사용 자격증",
        icon: AlertTriangle,
        tone: "border-rose-200 bg-rose-50 text-rose-700",
      },
    ];
  }, [dashboard, expiryDays]);

  const maxDepartmentCount = Math.max(
    1,
    ...(dashboard?.departmentHeadcounts.map((item) => item.totalCount) ?? [0]),
  );

  return (
    <>
      <PageHeader
        title="인사현황"
        description="인사/자격 운영 지표를 확인합니다."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          기준일 {dashboard?.summary.today ?? "-"} · 만료 기준{" "}
          {dashboard?.summary.expiryDateTo ?? "-"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            value={expiryDays}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              setExpiryDays(nextValue);
              void loadDashboard(nextValue);
            }}
            disabled={loading}
          >
            {expiryDayOptions.map((days) => (
              <option key={days} value={days}>
                {days}일
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
            새로고침
          </Button>
        </div>
      </div>

      {message ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {kpiItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="min-w-0">
              <CardContent className="flex items-center gap-3 p-4">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border", item.tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-muted-foreground">
                    {item.title}
                  </div>
                  <div className="text-2xl font-semibold leading-tight">
                    {formatNumber(item.value)}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.caption}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>부서별 인원</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>부서</TableHead>
                  <TableHead className="text-right">전체</TableHead>
                  <TableHead className="text-right">재직</TableHead>
                  <TableHead className="text-right">퇴사</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.departmentHeadcounts.length ? (
                  dashboard.departmentHeadcounts.map((item) => (
                    <TableRow key={item.departmentName}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.departmentName}</div>
                          <div className="h-1.5 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{
                                width: `${Math.max(6, (item.totalCount / maxDepartmentCount) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.totalCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.activeCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.resignedCount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      조회된 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>자격 만료 대상</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto p-0">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>사원</TableHead>
                  <TableHead>부서/직위</TableHead>
                  <TableHead>자격증</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard?.certificateExpiryItems.length ? (
                  dashboard.certificateExpiryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.employeeName || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.employeeCode || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.departmentName ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.positionName ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.certificateTypeName || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.certificateNo ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {dateLabel(item.expiredDate)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex min-w-16 items-center justify-center rounded-md border px-2 py-1 text-xs font-medium",
                            item.status === "expired"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {expiryLabel(item)}
                        </span>
                      </TableCell>
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
      </div>
    </>
  );
}
