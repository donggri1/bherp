"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, EyeOff, Upload } from "lucide-react";

import { ActionButtons } from "@/components/common/ActionButtons";
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
import { getBusinessUnits } from "@/features/operation/business-unit/api/business-unit.api";
import type { BusinessUnit } from "@/features/operation/business-unit/types/business-unit.types";
import { getDepartments } from "@/features/operation/departments/api/departments.api";
import type { Department } from "@/features/operation/departments/types/department.types";
import { getPositions } from "@/features/operation/positions/api/positions.api";
import type { Position } from "@/features/operation/positions/types/position.types";
import { getUsers } from "@/features/operation/users/api/users.api";
import type { ManagedUser } from "@/features/operation/users/types/user-management.types";
import { cn } from "@/lib/utils";
import {
  createEmployee,
  deleteEmployee,
  downloadEmployeeImportTemplate,
  getEmployeeOrganizationHistories,
  getEmployees,
  importEmployeesFromExcel,
  updateEmployee,
} from "../api/employees.api";
import type { Employee, EmployeeForm, EmployeeOrganizationHistory } from "../types/employee.types";

const emptyForm: EmployeeForm = {
  employeeCode: "",
  employeeName: "",
  userId: "",
  businessUnitId: "",
  departmentId: "",
  departmentName: "",
  positionId: "",
  positionName: "",
  email: "",
  phone: "",
  address: "",
  residentRegistrationNumber: "",
  hireDate: "",
  resignDate: "",
  isActive: true,
};

function toForm(item: Employee): EmployeeForm {
  return {
    employeeCode: item.employeeCode,
    employeeName: item.employeeName,
    userId: item.userId ? String(item.userId) : "",
    businessUnitId: item.businessUnitId ? String(item.businessUnitId) : "",
    departmentId: item.departmentId ? String(item.departmentId) : "",
    departmentName: item.departmentName ?? "",
    positionId: item.positionId ? String(item.positionId) : "",
    positionName: item.positionName ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    address: item.address ?? "",
    residentRegistrationNumber: item.residentRegistrationNumber ?? "",
    hireDate: item.hireDate ?? "",
    resignDate: item.resignDate ?? "",
    isActive: item.isActive,
  };
}

function maskResidentRegistrationNumber(value: string) {
  const text = value.trim();
  if (!text) return "";

  if (text.includes("-")) {
    const [front = "", back = ""] = text.split("-", 2);
    return `${"*".repeat(front.length || 6)}-${"*".repeat(back.length || 7)}`;
  }

  if (text.replace(/\D/g, "").length >= 13) return "******-*******";
  return "*".repeat(Math.min(text.length, 13));
}

function formatDate(value?: string | null) {
  return value || "-";
}

function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className={cn("grid gap-4", className)}>{children}</div>
    </section>
  );
}

export function EmployeesManager() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Employee[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [organizationHistories, setOrganizationHistories] = useState<
    EmployeeOrganizationHistory[]
  >([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [isResidentRegistrationNumberVisible, setIsResidentRegistrationNumberVisible] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const userMap = useMemo(
    () => new Map(users.map((item) => [item.id, `${item.userName} (${item.loginId})`])),
    [users],
  );
  const businessUnitMap = useMemo(
    () => new Map(businessUnits.map((item) => [item.id, item.businessUnitName])),
    [businessUnits],
  );
  const hasResidentRegistrationNumber = Boolean(form.residentRegistrationNumber.trim());
  const isResidentRegistrationNumberMasked =
    hasResidentRegistrationNumber && !isResidentRegistrationNumberVisible;
  const residentRegistrationNumberDisplayValue = isResidentRegistrationNumberMasked
    ? maskResidentRegistrationNumber(form.residentRegistrationNumber)
    : form.residentRegistrationNumber;

  const loadRefs = async () => {
    const [userResult, businessUnitResult, departmentResult, positionResult] = await Promise.all([
      getUsers({ page: 1, limit: 100, isActive: true }),
      getBusinessUnits({ page: 1, limit: 100, isActive: true }),
      getDepartments({ page: 1, limit: 100, isActive: true }),
      getPositions({ page: 1, limit: 100, isActive: true }),
    ]);
    setUsers(userResult.items);
    setBusinessUnits(businessUnitResult.items);
    setDepartments(departmentResult.items);
    setPositions(positionResult.items);
  };

  const loadOrganizationHistories = async (employeeId: number) => {
    const histories = await getEmployeeOrganizationHistories(employeeId);
    setOrganizationHistories(histories);
  };

  const loadItems = async (options: { departmentId?: string; employeeId?: number } = {}) => {
    setLoading(true);
    setMessage("");
    try {
      const nextDepartmentId =
        options.departmentId !== undefined ? options.departmentId : departmentFilter;
      const result = await getEmployees({
        keyword,
        employeeId: options.employeeId,
        departmentId: nextDepartmentId ? Number(nextDepartmentId) : undefined,
        isActive: isActiveFilter === "" ? undefined : isActiveFilter === "true",
      });
      setItems(result.items);
      const requestedEmployee = options.employeeId
        ? result.items.find((item) => item.id === options.employeeId)
        : null;
      if (requestedEmployee) {
        setSelectedId(requestedEmployee.id);
        setForm(toForm(requestedEmployee));
        setIsResidentRegistrationNumberVisible(false);
        await loadOrganizationHistories(requestedEmployee.id);
      } else if (selectedId && !result.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setForm(emptyForm);
        setOrganizationHistories([]);
        setIsResidentRegistrationNumberVisible(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialDepartmentId = params.get("departmentId") ?? "";
    const initialEmployeeId = Number(params.get("employeeId") ?? "");
    if (initialDepartmentId) setDepartmentFilter(initialDepartmentId);

    void Promise.all([
      loadRefs(),
      loadItems({
        departmentId: initialDepartmentId,
        employeeId: Number.isInteger(initialEmployeeId) && initialEmployeeId > 0
          ? initialEmployeeId
          : undefined,
      }),
    ]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find((item) => String(item.id) === departmentId);
    setForm((current) => ({
      ...current,
      departmentId,
      departmentName: department?.departmentName ?? "",
    }));
  };

  const handlePositionChange = (positionId: string) => {
    const position = positions.find((item) => String(item.id) === positionId);
    setForm((current) => ({
      ...current,
      positionId,
      positionName: position?.positionName ?? "",
    }));
  };

  const handleResidentRegistrationNumberChange = (value: string) => {
    setIsResidentRegistrationNumberVisible(true);
    handleChange("residentRegistrationNumber", value);
  };

  const handleSelect = (item: Employee) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    void loadOrganizationHistories(item.id).catch((error) => {
      setMessage(error instanceof Error ? error.message : "조직/직위 이력 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    setIsResidentRegistrationNumberVisible(false);
    setMessage("");
  };

  const handleNew = () => {
    const department = departments.find((item) => String(item.id) === departmentFilter);
    setSelectedId(null);
    setForm({
      ...emptyForm,
      departmentId: departmentFilter,
      departmentName: department?.departmentName ?? "",
    });
    setOrganizationHistories([]);
    setIsResidentRegistrationNumberVisible(true);
    setMessage("");
  };

  const handleSave = async () => {
    if (!form.employeeName.trim()) {
      setMessage("사원명은 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const saved = selectedId ? await updateEmployee(selectedId, form) : await createEmployee(form);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      await loadOrganizationHistories(saved.id);
      setIsResidentRegistrationNumberVisible(false);
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
    if (!window.confirm(`${selectedItem.employeeName} 사원을 삭제할까요?`)) return;

    setLoading(true);
    setMessage("");
    try {
      await deleteEmployee(selectedId);
      setSelectedId(null);
      setForm(emptyForm);
      setOrganizationHistories([]);
      setIsResidentRegistrationNumberVisible(true);
      setMessage("삭제되었습니다.");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await downloadEmployeeImportTemplate();
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("사원등록 양식을 다운로드했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사원등록 양식 다운로드에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setMessage("사원 등록 파일은 .xlsx 또는 .xls만 업로드할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await importEmployeesFromExcel(file);
      await loadItems();
      const failures = result.items
        .filter((item) => item.status === "failed")
        .slice(0, 3)
        .map((item) => `${item.rowNo}행: ${item.message}`);
      setMessage(
        [
          `엑셀 등록 완료: 성공 ${result.created}건, 실패 ${result.failed}건`,
          ...failures,
        ].join("\n"),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사원 엑셀 등록에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="사원등록" description="사원 정보를 등록하고 관리합니다." />
      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              검색어
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="코드, 사원명, 부서" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              부서
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="">전체</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.departmentName}
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={loading}>
            <Download className="size-4" aria-hidden />
            양식 다운로드
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick} disabled={loading}>
            <Upload className="size-4" aria-hidden />
            엑셀 업로드
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
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
      </div>

      {message ? <div className="whitespace-pre-line rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-auto p-0">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>사원코드</TableHead>
                  <TableHead>사원명</TableHead>
                  <TableHead>사업단위</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>직위</TableHead>
                  <TableHead>휴대폰</TableHead>
                  <TableHead>입사일</TableHead>
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
                      <TableCell className="whitespace-nowrap">{item.employeeCode}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{item.employeeName}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.businessUnitId ? businessUnitMap.get(item.businessUnitId) ?? "-" : "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.departmentName ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.positionName ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.phone ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.hireDate ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.isActive ? "사용" : "미사용"}</TableCell>
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
            <CardTitle>사원 프로필</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <DetailSection title="기본정보">
              <label className="space-y-2 text-sm font-medium">
                사원코드
                <Input value={form.employeeCode} readOnly placeholder="저장 시 자동 생성" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                사원명
                <Input value={form.employeeName} onChange={(event) => handleChange("employeeName", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                연결 사용자
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.userId}
                  onChange={(event) => handleChange("userId", event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>
                      {userMap.get(item.id)}
                    </option>
                  ))}
                </select>
              </label>
            </DetailSection>

            <DetailSection title="조직/직위">
              <label className="space-y-2 text-sm font-medium">
                사업단위
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.businessUnitId}
                  onChange={(event) => handleChange("businessUnitId", event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {businessUnits.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.businessUnitName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                부서
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.departmentId}
                  onChange={(event) => handleDepartmentChange(event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                직위
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.positionId}
                  onChange={(event) => handlePositionChange(event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.positionName}
                    </option>
                  ))}
                </select>
              </label>
              {selectedId ? (
                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">조직/직위 이력</span>
                    <span className="text-xs text-muted-foreground">
                      최근 {organizationHistories.slice(0, 5).length}건
                    </span>
                  </div>
                  {organizationHistories.length ? (
                    <div className="space-y-2">
                      {organizationHistories.slice(0, 5).map((history) => (
                        <div
                          key={history.id}
                          className="rounded-md border bg-background px-3 py-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2 font-medium">
                            <span>{history.departmentName ?? "부서 미지정"}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{history.positionName ?? "직위 미지정"}</span>
                            {history.isCurrent ? (
                              <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                                현재
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {history.businessUnitName ?? "사업단위 미지정"} ·{" "}
                            {formatDate(history.effectiveFrom)} ~{" "}
                            {formatDate(history.effectiveTo)}
                          </div>
                          {history.changeReason ? (
                            <div className="mt-1 text-muted-foreground">
                              {history.changeReason}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
                      이력 데이터가 없습니다. 백필 실행 후 현재 조직/직위가 이력으로 남습니다.
                    </div>
                  )}
                </div>
              ) : null}
            </DetailSection>

            <DetailSection title="연락처/개인정보">
              <label className="space-y-2 text-sm font-medium">
                이메일
                <Input value={form.email} onChange={(event) => handleChange("email", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                휴대폰
                <Input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                주소
                <Input value={form.address} onChange={(event) => handleChange("address", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                주민등록번호
                <div className="relative">
                  <Input
                    value={residentRegistrationNumberDisplayValue}
                    onChange={(event) => handleResidentRegistrationNumberChange(event.target.value)}
                    readOnly={isResidentRegistrationNumberMasked}
                    autoComplete="off"
                    placeholder="예: 900101-1234567"
                    className={hasResidentRegistrationNumber ? "pr-10" : undefined}
                  />
                  {hasResidentRegistrationNumber ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-1 top-1"
                      aria-label={
                        isResidentRegistrationNumberVisible
                          ? "주민등록번호 가리기"
                          : "주민등록번호 보기"
                      }
                      title={
                        isResidentRegistrationNumberVisible
                          ? "주민등록번호 가리기"
                          : "주민등록번호 보기"
                      }
                      aria-pressed={isResidentRegistrationNumberVisible}
                      onClick={() =>
                        setIsResidentRegistrationNumberVisible((current) => !current)
                      }
                    >
                      {isResidentRegistrationNumberVisible ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </Button>
                  ) : null}
                </div>
              </label>
            </DetailSection>

            <DetailSection title="재직정보" className="sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                입사일
                <Input type="date" value={form.hireDate} onChange={(event) => handleChange("hireDate", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                퇴사일
                <Input type="date" value={form.resignDate} onChange={(event) => handleChange("resignDate", event.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                <input type="checkbox" checked={form.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} />
                사용
              </label>
            </DetailSection>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
