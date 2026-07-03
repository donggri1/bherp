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
import { getBusinessUnits } from "@/features/operation/business-unit/api/business-unit.api";
import type { BusinessUnit } from "@/features/operation/business-unit/types/business-unit.types";
import { getDepartments } from "@/features/operation/departments/api/departments.api";
import type { Department } from "@/features/operation/departments/types/department.types";
import { getPositions } from "@/features/operation/positions/api/positions.api";
import type { Position } from "@/features/operation/positions/types/position.types";
import { getUsers } from "@/features/operation/users/api/users.api";
import type { ManagedUser } from "@/features/operation/users/types/user-management.types";
import { cn } from "@/lib/utils";
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from "../api/employees.api";
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

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>목록</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
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
                      <TableCell>{item.employeeCode}</TableCell>
                      <TableCell className="font-medium">{item.employeeName}</TableCell>
                      <TableCell>{item.businessUnitId ? businessUnitMap.get(item.businessUnitId) ?? "-" : "-"}</TableCell>
                      <TableCell>{item.departmentName ?? "-"}</TableCell>
                      <TableCell>{item.positionName ?? "-"}</TableCell>
                      <TableCell>{item.phone ?? "-"}</TableCell>
                      <TableCell>{item.hireDate ?? "-"}</TableCell>
                      <TableCell>{item.isActive ? "사용" : "미사용"}</TableCell>
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
