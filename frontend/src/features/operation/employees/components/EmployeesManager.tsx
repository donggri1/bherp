"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

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
  getEmployees,
  importEmployeesFromExcel,
  updateEmployee,
} from "../api/employees.api";
import type { Employee, EmployeeForm } from "../types/employee.types";

const emptyForm: EmployeeForm = {
  employeeCode: "",
  employeeName: "",
  userId: "",
  businessUnitId: "",
  departmentName: "",
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
    departmentName: item.departmentName ?? "",
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

export function EmployeesManager() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Employee[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
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
  const departmentNames = useMemo(
    () => departments.map((item) => item.departmentName),
    [departments],
  );
  const positionNames = useMemo(
    () => positions.map((item) => item.positionName),
    [positions],
  );

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

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getEmployees({
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
    void Promise.all([loadRefs(), loadItems()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSelect = (item: Employee) => {
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
            <CardTitle>상세</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                부서
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.departmentName}
                  onChange={(event) => handleChange("departmentName", event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {departmentNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                직위
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  value={form.positionName}
                  onChange={(event) => handleChange("positionName", event.target.value)}
                >
                  <option value="">선택 안 함</option>
                  {positionNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
              <Input
                value={form.residentRegistrationNumber}
                onChange={(event) => handleChange("residentRegistrationNumber", event.target.value)}
                placeholder="예: 900101-1234567"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                입사일
                <Input type="date" value={form.hireDate} onChange={(event) => handleChange("hireDate", event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                퇴사일
                <Input type="date" value={form.resignDate} onChange={(event) => handleChange("resignDate", event.target.value)} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isActive} onChange={(event) => handleChange("isActive", event.target.checked)} />
              사용
            </label>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
