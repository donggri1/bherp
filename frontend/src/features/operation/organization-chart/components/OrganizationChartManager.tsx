"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
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
import {
  getOrganizationChart,
  getOrganizationChartDepartmentEmployees,
} from "../api/organization-chart.api";
import type {
  OrganizationChart,
  OrganizationChartDepartmentEmployees,
  OrganizationChartEmployee,
  OrganizationChartNode,
} from "../types/organization-chart.types";

type FlattenedNode = {
  node: OrganizationChartNode;
  depth: number;
};

function flattenNodes(
  nodes: OrganizationChartNode[],
  expandedIds: Set<number>,
  depth = 0,
): FlattenedNode[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(expandedIds.has(node.id)
      ? flattenNodes(node.children, expandedIds, depth + 1)
      : []),
  ]);
}

function collectNodeIds(nodes: OrganizationChartNode[]): number[] {
  return nodes.flatMap((node) => [node.id, ...collectNodeIds(node.children)]);
}

function findNode(
  nodes: OrganizationChartNode[],
  id: number | null,
): OrganizationChartNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function employeeStatusLabel(employee: OrganizationChartEmployee) {
  if (employee.employmentStatus === "active") return "재직";
  if (employee.employmentStatus === "resigned") return "퇴사";
  return "미사용";
}

export function OrganizationChartManager() {
  const router = useRouter();
  const [chart, setChart] = useState<OrganizationChart | null>(null);
  const [departmentEmployees, setDepartmentEmployees] =
    useState<OrganizationChartDepartmentEmployees | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDepartmentEmployees = async (departmentId: number) => {
    setEmployeeLoading(true);
    try {
      const result = await getOrganizationChartDepartmentEmployees(departmentId);
      setDepartmentEmployees(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "부서 사원 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("인증")) router.push("/login");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setEmployeeLoading(false);
    }
  };

  const loadChart = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getOrganizationChart();
      setChart(result);
      const nodeIds = collectNodeIds(result.items);
      setExpandedIds(new Set(nodeIds));
      const nextSelectedId =
        selectedDepartmentId && nodeIds.includes(selectedDepartmentId)
          ? selectedDepartmentId
          : (nodeIds[0] ?? null);
      setSelectedDepartmentId(nextSelectedId);
      if (nextSelectedId) await loadDepartmentEmployees(nextSelectedId);
      else setDepartmentEmployees(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("인증")) router.push("/login");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () => flattenNodes(chart?.items ?? [], expandedIds),
    [chart, expandedIds],
  );
  const selectedDepartment = useMemo(
    () => findNode(chart?.items ?? [], selectedDepartmentId),
    [chart, selectedDepartmentId],
  );

  const toggleNode = (id: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectDepartment = (departmentId: number) => {
    setSelectedDepartmentId(departmentId);
    void loadDepartmentEmployees(departmentId);
  };

  const openEmployeesByDepartment = () => {
    if (!selectedDepartmentId) return;
    router.push(`/operation/employees?departmentId=${selectedDepartmentId}`);
  };

  const openEmployee = (employeeId: number) => {
    router.push(`/operation/employees?employeeId=${employeeId}`);
  };

  const summaryItems = [
    {
      title: "부서",
      value: chart?.totals.departmentCount ?? 0,
      icon: Building2,
      tone: "border-slate-200 bg-slate-50 text-slate-700",
    },
    {
      title: "전체 사원",
      value: chart?.totals.totalEmployees ?? 0,
      icon: Users,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      title: "재직",
      value: chart?.totals.activeEmployees ?? 0,
      icon: Users,
      tone: "border-sky-200 bg-sky-50 text-sky-700",
    },
    {
      title: "미배정",
      value: chart?.totals.unassignedEmployees ?? 0,
      icon: Users,
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];

  return (
    <>
      <PageHeader title="부서조직도" description="부서 계층과 인원 배치를 확인합니다." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="min-w-0">
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md border",
                      item.tone,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-muted-foreground">
                      {item.title}
                    </div>
                    <div className="text-2xl font-semibold leading-tight">
                      {formatNumber(item.value)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={loadChart} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          새로고침
        </Button>
      </div>

      {message ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>조직도</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto p-0">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>부서</TableHead>
                  <TableHead>부서코드</TableHead>
                  <TableHead className="text-right">전체</TableHead>
                  <TableHead className="text-right">재직</TableHead>
                  <TableHead>사용여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  rows.map(({ node, depth }) => {
                    const hasChildren = node.children.length > 0;
                    const expanded = expandedIds.has(node.id);
                    return (
                      <TableRow
                        key={node.id}
                        className={cn(
                          "cursor-pointer",
                          selectedDepartmentId === node.id && "bg-muted",
                        )}
                        onClick={() => handleSelectDepartment(node.id)}
                      >
                        <TableCell>
                          <div
                            className="flex min-h-9 items-center gap-2"
                            style={{ paddingLeft: `${depth * 24}px` }}
                          >
                            <button
                              type="button"
                              className={cn(
                                "flex size-7 items-center justify-center rounded-md border text-muted-foreground",
                                !hasChildren && "invisible",
                              )}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleNode(node.id);
                              }}
                              aria-label={expanded ? "접기" : "펼치기"}
                            >
                              {expanded ? (
                                <ChevronDown className="size-4" aria-hidden />
                              ) : (
                                <ChevronRight className="size-4" aria-hidden />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {node.departmentName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                하위부서 {formatNumber(node.children.length)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {node.departmentCode}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(node.totalEmployees)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(node.activeEmployees)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex min-w-14 justify-center rounded-md border px-2 py-1 text-xs font-medium",
                              node.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600",
                            )}
                          >
                            {node.isActive ? "사용" : "미사용"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>부서 사원</CardTitle>
                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedDepartment?.departmentName ?? "부서를 선택하세요."}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openEmployeesByDepartment}
                disabled={!selectedDepartmentId}
              >
                사원등록
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto p-0">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>사원</TableHead>
                  <TableHead>직위</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">이동</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentEmployees?.items.length ? (
                  departmentEmployees.items.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium">{employee.employeeName}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.employeeCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{employee.positionName ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.phone ?? "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex min-w-14 justify-center rounded-md border px-2 py-1 text-xs font-medium",
                            employee.employmentStatus === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600",
                          )}
                        >
                          {employeeStatusLabel(employee)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEmployee(employee.id)}
                        >
                          열기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {employeeLoading ? "조회 중입니다." : "조회된 사원이 없습니다."}
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
