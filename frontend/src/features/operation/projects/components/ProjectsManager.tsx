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
import { createProject, deleteProject, getProjects, updateProject } from "../api/projects.api";
import type { Project, ProjectForm, ProjectStatus } from "../types/project.types";

const projectStatusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행" },
  { value: "completed", label: "완료" },
  { value: "on_hold", label: "보류" },
  { value: "cancelled", label: "취소" },
];

const projectStatusMap = new Map(
  projectStatusOptions.map((item) => [item.value, item.label] as const),
);

const emptyForm: ProjectForm = {
  projectCode: "",
  constructionNo: "",
  projectName: "",
  clientName: "",
  siteAddress: "",
  startDate: "",
  endDate: "",
  projectStatus: "planned",
  memo: "",
  isActive: true,
  sortOrder: "0",
};

function toForm(item: Project): ProjectForm {
  return {
    projectCode: item.projectCode,
    constructionNo: item.constructionNo ?? "",
    projectName: item.projectName,
    clientName: item.clientName ?? "",
    siteAddress: item.siteAddress ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    projectStatus: item.projectStatus,
    memo: item.memo ?? "",
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return `${startDate} ~`;
  if (endDate) return `~ ${endDate}`;
  return "-";
}

export function ProjectsManager() {
  const router = useRouter();
  const [items, setItems] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      const result = await getProjects({
        keyword,
        projectStatus: statusFilter ? (statusFilter as ProjectStatus) : undefined,
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

  const handleChange = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: Project) => {
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
    if (!form.projectName.trim()) {
      setMessage("프로젝트명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId
        ? await updateProject(selectedId, form)
        : await createProject(form);
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
    if (!window.confirm(`${selectedItem.projectName} 프로젝트를 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteProject(selectedId);
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
        title="프로젝트등록"
        description="공사번호와 현장 기본 정보를 등록하고 관리합니다."
      />

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
                placeholder="코드, 공사번호, 프로젝트명, 발주처"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              상태
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">전체</option>
                {projectStatusOptions.map((item) => (
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
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead>프로젝트코드</TableHead>
                  <TableHead>공사번호</TableHead>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>발주처</TableHead>
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
                      <TableCell className="whitespace-nowrap">{item.projectCode}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.constructionNo ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {item.projectName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.clientName ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateRange(item.startDate, item.endDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {projectStatusMap.get(item.projectStatus) ?? item.projectStatus}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.isActive ? "사용" : "미사용"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                  프로젝트코드
                  <Input value={form.projectCode} readOnly placeholder="저장 시 자동 생성" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  공사번호
                  <Input
                    value={form.constructionNo}
                    onChange={(event) => handleChange("constructionNo", event.target.value)}
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                프로젝트명
                <Input
                  value={form.projectName}
                  onChange={(event) => handleChange("projectName", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 border-t pt-5">
              <label className="space-y-2 text-sm font-medium">
                발주처
                <Input
                  value={form.clientName}
                  onChange={(event) => handleChange("clientName", event.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                현장주소
                <Input
                  value={form.siteAddress}
                  onChange={(event) => handleChange("siteAddress", event.target.value)}
                />
              </label>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  상태
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    value={form.projectStatus}
                    onChange={(event) =>
                      handleChange("projectStatus", event.target.value as ProjectStatus)
                    }
                  >
                    {projectStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
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
              </div>
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
