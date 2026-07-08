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
import { getProjects } from "@/features/operation/projects/api/projects.api";
import type { Project } from "@/features/operation/projects/types/project.types";
import { cn } from "@/lib/utils";
import {
  createProjectSite,
  deleteProjectSite,
  getProjectSites,
  updateProjectSite,
} from "../api/project-sites.api";
import type {
  ProjectSite,
  ProjectSiteForm,
  ProjectSiteStatus,
} from "../types/project-site.types";

const siteStatusOptions: { value: ProjectSiteStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행" },
  { value: "completed", label: "완료" },
  { value: "on_hold", label: "보류" },
  { value: "cancelled", label: "취소" },
];

const siteStatusMap = new Map(siteStatusOptions.map((item) => [item.value, item.label] as const));

const emptyForm: ProjectSiteForm = {
  siteCode: "",
  projectId: "",
  siteName: "",
  siteAddress: "",
  managerName: "",
  managerPhone: "",
  startDate: "",
  endDate: "",
  siteStatus: "planned",
  memo: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: ProjectSite): ProjectSiteForm {
  return {
    siteCode: item.siteCode,
    projectId: String(item.projectId),
    siteName: item.siteName,
    siteAddress: item.siteAddress ?? "",
    managerName: item.managerName ?? "",
    managerPhone: item.managerPhone ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    siteStatus: item.siteStatus,
    memo: item.memo ?? "",
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function projectLabel(project?: Project | null) {
  if (!project) return "-";
  return `${project.projectName} (${project.projectCode})`;
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  if (endDate) return `~ ${endDate}`;
  return "-";
}

export function ProjectSitesManager() {
  const router = useRouter();
  const [items, setItems] = useState<ProjectSite[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectSiteForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const loadProjects = async () => {
    const result = await getProjects({ page: 1, limit: 100, isActive: true });
    setProjects(result.items);
  };

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getProjectSites({
        keyword,
        projectId: projectFilter ? Number(projectFilter) : undefined,
        siteStatus: statusFilter ? (statusFilter as ProjectSiteStatus) : undefined,
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
    void Promise.all([loadProjects(), loadItems()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof ProjectSiteForm>(
    key: K,
    value: ProjectSiteForm[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: ProjectSite) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    setMessage("");
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm({ ...emptyForm, projectId: projectFilter || "" });
    setMessage("");
  };

  const handleSave = async () => {
    if (!form.projectId || !form.siteName.trim()) {
      setMessage("프로젝트와 현장명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateProjectSite(selectedId, form)
        : await createProjectSite(form);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("저장되었습니다.");
      await Promise.all([loadProjects(), loadItems()]);
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
    if (!window.confirm(`${selectedItem.siteName} 현장 정보를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteProjectSite(selectedId);
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
        title="현장정보관리"
        description="프로젝트별 현장과 담당 정보를 등록하고 관리합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2 text-sm font-medium">
              검색어
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="프로젝트, 현장, 담당자"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              프로젝트
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
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
              상태
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">전체</option>
                {siteStatusOptions.map((item) => (
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
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead>현장코드</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>현장명</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>연락처</TableHead>
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
                      <TableCell className="whitespace-nowrap">{item.siteCode}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {projectLabel(item.project)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {item.siteName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.managerName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.managerPhone ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateRange(item.startDate, item.endDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {siteStatusMap.get(item.siteStatus) ?? item.siteStatus}
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  현장코드
                  <Input value={form.siteCode} readOnly placeholder="저장 시 자동 생성" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  상태
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    value={form.siteStatus}
                    onChange={(event) =>
                      handleChange("siteStatus", event.target.value as ProjectSiteStatus)
                    }
                  >
                    {siteStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                프로젝트
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.projectId}
                  onChange={(event) => handleChange("projectId", event.target.value)}
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
                현장명
                <Input
                  value={form.siteName}
                  onChange={(event) => handleChange("siteName", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                현장주소
                <Input
                  value={form.siteAddress}
                  onChange={(event) => handleChange("siteAddress", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 border-t pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  담당자
                  <Input
                    value={form.managerName}
                    onChange={(event) => handleChange("managerName", event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  연락처
                  <Input
                    value={form.managerPhone}
                    onChange={(event) => handleChange("managerPhone", event.target.value)}
                  />
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
