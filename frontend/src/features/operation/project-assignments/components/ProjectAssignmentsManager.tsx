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
import { getEmployees } from "@/features/operation/employees/api/employees.api";
import type { Employee } from "@/features/operation/employees/types/employee.types";
import { getProjectSites } from "@/features/operation/project-sites/api/project-sites.api";
import type { ProjectSite } from "@/features/operation/project-sites/types/project-site.types";
import { getProjects } from "@/features/operation/projects/api/projects.api";
import type { Project } from "@/features/operation/projects/types/project.types";
import { cn } from "@/lib/utils";
import {
  createProjectAssignment,
  deleteProjectAssignment,
  getProjectAssignments,
  updateProjectAssignment,
} from "../api/project-assignments.api";
import type {
  ProjectAssignment,
  ProjectAssignmentForm,
  ProjectAssignmentStatus,
} from "../types/project-assignment.types";

const assignmentStatusOptions: { value: ProjectAssignmentStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "assigned", label: "투입" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

const assignmentStatusMap = new Map(
  assignmentStatusOptions.map((item) => [item.value, item.label] as const),
);

const emptyForm: ProjectAssignmentForm = {
  projectId: "",
  projectSiteId: "",
  employeeId: "",
  assignmentRole: "",
  startDate: "",
  endDate: "",
  assignmentStatus: "planned",
  memo: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: ProjectAssignment): ProjectAssignmentForm {
  return {
    projectId: String(item.projectId),
    projectSiteId: item.projectSiteId ? String(item.projectSiteId) : "",
    employeeId: String(item.employeeId),
    assignmentRole: item.assignmentRole ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    assignmentStatus: item.assignmentStatus,
    memo: item.memo ?? "",
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function projectLabel(project?: Project | null) {
  if (!project) return "-";
  return `${project.projectName} (${project.projectCode})`;
}

function siteLabel(site?: ProjectSite | null) {
  if (!site) return "-";
  return `${site.siteName} (${site.siteCode})`;
}

function employeeLabel(employee?: Employee | null) {
  if (!employee) return "-";
  return `${employee.employeeName} (${employee.employeeCode})`;
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  if (endDate) return `~ ${endDate}`;
  return "-";
}

export function ProjectAssignmentsManager() {
  const router = useRouter();
  const [items, setItems] = useState<ProjectAssignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<ProjectSite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectAssignmentForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const filteredSitesForSearch = useMemo(
    () => sites.filter((site) => !projectFilter || site.projectId === Number(projectFilter)),
    [projectFilter, sites],
  );

  const filteredSitesForForm = useMemo(
    () => sites.filter((site) => !form.projectId || site.projectId === Number(form.projectId)),
    [form.projectId, sites],
  );

  const loadReferences = async () => {
    const [projectResult, siteResult, employeeResult] = await Promise.all([
      getProjects({ page: 1, limit: 100, isActive: true }),
      getProjectSites({ page: 1, limit: 100, isActive: true }),
      getEmployees({ page: 1, limit: 100, isActive: true }),
    ]);
    setProjects(projectResult.items);
    setSites(siteResult.items);
    setEmployees(employeeResult.items);
  };

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getProjectAssignments({
        keyword,
        projectId: projectFilter ? Number(projectFilter) : undefined,
        projectSiteId: siteFilter ? Number(siteFilter) : undefined,
        assignmentStatus: statusFilter ? (statusFilter as ProjectAssignmentStatus) : undefined,
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
    void Promise.all([loadReferences(), loadItems()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof ProjectAssignmentForm>(
    key: K,
    value: ProjectAssignmentForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProjectChange = (projectId: string) => {
    setForm((current) => ({ ...current, projectId, projectSiteId: "" }));
  };

  const handleSearchProjectChange = (projectId: string) => {
    setProjectFilter(projectId);
    setSiteFilter("");
  };

  const handleSelect = (item: ProjectAssignment) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    setMessage("");
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm({
      ...emptyForm,
      projectId: projectFilter || "",
      projectSiteId: siteFilter || "",
      startDate: new Date().toISOString().slice(0, 10),
    });
    setMessage("");
  };

  const handleSave = async () => {
    if (!form.projectId || !form.employeeId || !form.startDate) {
      setMessage("프로젝트, 사원, 시작일은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateProjectAssignment(selectedId, form)
        : await createProjectAssignment(form);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("저장되었습니다.");
      await Promise.all([loadReferences(), loadItems()]);
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
    if (!window.confirm(`${employeeLabel(selectedItem.employee)} 배치를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteProjectAssignment(selectedId);
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
      <PageHeader
        title="현장인력배치"
        description="프로젝트와 현장별 사원 투입 기간과 역할을 관리합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <label className="space-y-2 text-sm font-medium">
              검색어
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="프로젝트, 현장, 사원, 역할"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              프로젝트
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={projectFilter}
                onChange={(event) => handleSearchProjectChange(event.target.value)}
              >
                <option value="">전체</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName} ({project.projectCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              현장
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={siteFilter}
                onChange={(event) => setSiteFilter(event.target.value)}
              >
                <option value="">전체</option>
                {filteredSitesForSearch.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteName} ({site.siteCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              상태
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">전체</option>
                {assignmentStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-auto p-0">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>현장</TableHead>
                  <TableHead>사원</TableHead>
                  <TableHead>부서/직위</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>상태</TableHead>
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
                      <TableCell className="whitespace-nowrap">
                        {projectLabel(item.project)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {siteLabel(item.projectSite)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {employeeLabel(item.employee)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.employee?.departmentName ?? "-"} / {item.employee?.positionName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.assignmentRole ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateRange(item.startDate, item.endDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {assignmentStatusMap.get(item.assignmentStatus) ?? item.assignmentStatus}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.isActive ? "사용" : "미사용"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
          <CardContent className="grid gap-5">
            <div className="grid gap-4">
              <label className="space-y-2 text-sm font-medium">
                프로젝트
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.projectId}
                  onChange={(event) => handleProjectChange(event.target.value)}
                >
                  <option value="">선택</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName} ({project.projectCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                현장
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.projectSiteId}
                  onChange={(event) => handleChange("projectSiteId", event.target.value)}
                >
                  <option value="">미지정</option>
                  {filteredSitesForForm.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.siteName} ({site.siteCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                사원
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.employeeId}
                  onChange={(event) => handleChange("employeeId", event.target.value)}
                >
                  <option value="">선택</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeName} ({employee.employeeCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 border-t pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  역할
                  <Input
                    value={form.assignmentRole}
                    onChange={(event) => handleChange("assignmentRole", event.target.value)}
                    placeholder="현장대리인, 작업자"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  상태
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    value={form.assignmentStatus}
                    onChange={(event) =>
                      handleChange(
                        "assignmentStatus",
                        event.target.value as ProjectAssignmentStatus,
                      )
                    }
                  >
                    {assignmentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  시작일
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => handleChange("startDate", event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  종료일
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => handleChange("endDate", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 border-t pt-5">
              <label className="space-y-2 text-sm font-medium">
                정렬순서
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => handleChange("sortOrder", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                메모
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.memo}
                  onChange={(event) => handleChange("memo", event.target.value)}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
