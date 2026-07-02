"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
import { getCertificateTypes } from "@/features/operation/certificate-types/api/certificate-types.api";
import type { CertificateType } from "@/features/operation/certificate-types/types/certificate-type.types";
import { getEmployees } from "@/features/operation/employees/api/employees.api";
import type { Employee } from "@/features/operation/employees/types/employee.types";
import { cn } from "@/lib/utils";
import {
  createEmployeeCertificate,
  deleteEmployeeCertificate,
  getEmployeeCertificates,
  updateEmployeeCertificate,
} from "../api/employee-certificates.api";
import type {
  EmployeeCertificate,
  EmployeeCertificateForm,
} from "../types/employee-certificate.types";

const emptyForm: EmployeeCertificateForm = {
  employeeId: "",
  certificateTypeId: "",
  certificateNo: "",
  acquiredDate: "",
  expiredDate: "",
  memo: "",
  isActive: true,
};

function toForm(item: EmployeeCertificate): EmployeeCertificateForm {
  return {
    employeeId: String(item.employeeId),
    certificateTypeId: String(item.certificateTypeId),
    certificateNo: item.certificateNo ?? "",
    acquiredDate: item.acquiredDate ?? "",
    expiredDate: item.expiredDate ?? "",
    memo: item.memo ?? "",
    isActive: item.isActive,
  };
}

function employeeLabel(item: Employee) {
  return `${item.employeeName} (${item.employeeCode})`;
}

export function EmployeeCertificatesManager() {
  const router = useRouter();
  const [items, setItems] = useState<EmployeeCertificate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeCertificateForm>(emptyForm);
  const [employeeKeyword, setEmployeeKeyword] = useState("");
  const [certificateTypeFilter, setCertificateTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  const employeeMap = useMemo(
    () => new Map(employees.map((item) => [item.id, employeeLabel(item)])),
    [employees],
  );

  const certificateTypeMap = useMemo(
    () => new Map(certificateTypes.map((item) => [item.id, item.certificateTypeName])),
    [certificateTypes],
  );

  const certificateTypeIssuerMap = useMemo(
    () => new Map(certificateTypes.map((item) => [item.id, item.issuer ?? "-"])),
    [certificateTypes],
  );

  const loadEmployees = async (keyword = employeeKeyword) => {
    setEmployeeLoading(true);
    try {
      const result = await getEmployees({
        page: 1,
        limit: 100,
        keyword: keyword || undefined,
        isActive: true,
      });
      setEmployees(result.items);
      if (selectedEmployeeId && !result.items.some((item) => item.id === selectedEmployeeId)) {
        setSelectedEmployeeId(null);
        setSelectedId(null);
        setItems([]);
        setForm(emptyForm);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사원 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setEmployeeLoading(false);
    }
  };

  const loadCertificateTypes = async () => {
    const result = await getCertificateTypes({ page: 1, limit: 100, isActive: true });
    setCertificateTypes(result.items);
  };

  const loadItems = async (employeeId = selectedEmployeeId) => {
    if (!employeeId) {
      setItems([]);
      setSelectedId(null);
      setForm(emptyForm);
      setMessage("사원을 선택하면 해당 사원의 자격증을 조회합니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await getEmployeeCertificates({
        employeeId,
        certificateTypeId: certificateTypeFilter ? Number(certificateTypeFilter) : undefined,
      });
      setItems(result.items);
      if (selectedId && !result.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setForm({ ...emptyForm, employeeId: String(employeeId) });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadEmployees(""), loadCertificateTypes()]).catch((error) => {
      setMessage(error instanceof Error ? error.message : "초기 조회에 실패했습니다.");
      if (error instanceof Error && error.message.includes("로그인")) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof EmployeeCertificateForm>(
    key: K,
    value: EmployeeCertificateForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setSelectedId(null);
    setForm({ ...emptyForm, employeeId: String(employee.id) });
    setMessage("");
    void loadItems(employee.id);
  };

  const handleSelect = (item: EmployeeCertificate) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    setMessage("");
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm({ ...emptyForm, employeeId: selectedEmployeeId ? String(selectedEmployeeId) : "" });
    setMessage(selectedEmployeeId ? "" : "먼저 사원을 선택하세요.");
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      setMessage("먼저 사원을 선택하세요.");
      return;
    }
    if (!form.certificateTypeId) {
      setMessage("자격증 종류는 필수입니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const payload = { ...form, employeeId: String(selectedEmployeeId) };
      const saved = selectedId
        ? await updateEmployeeCertificate(selectedId, payload)
        : await createEmployeeCertificate(payload);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage("저장되었습니다.");
      await loadItems(selectedEmployeeId);
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
    if (!window.confirm("선택한 사원 자격증 정보를 삭제할까요?")) return;
    setLoading(true);
    setMessage("");
    try {
      await deleteEmployeeCertificate(selectedId);
      setSelectedId(null);
      setForm({ ...emptyForm, employeeId: selectedEmployeeId ? String(selectedEmployeeId) : "" });
      setMessage("삭제되었습니다.");
      await loadItems(selectedEmployeeId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="사원별자격증등록" description="사원을 선택한 뒤 보유 자격증을 등록하고 관리합니다." />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>사원선택</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="사원명 또는 사원코드"
                value={employeeKeyword}
                onChange={(event) => setEmployeeKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadEmployees();
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => void loadEmployees()}
                disabled={employeeLoading}
                aria-label="사원 검색"
              >
                <Search className="size-4" aria-hidden />
              </Button>
            </div>

            <div className="max-h-[560px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사원</TableHead>
                    <TableHead>부서</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length ? employees.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn("cursor-pointer", selectedEmployeeId === item.id && "bg-muted")}
                      onClick={() => handleEmployeeSelect(item)}
                    >
                      <TableCell>
                        <div className="font-medium">{item.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{item.employeeCode}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.departmentName ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.positionName ?? "-"}</div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        조회된 사원이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>검색조건</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">선택 사원</div>
                  <div className="mt-1 font-medium">
                    {selectedEmployee ? employeeLabel(selectedEmployee) : "사원을 선택하세요."}
                  </div>
                </div>
                <label className="space-y-2 text-sm font-medium">
                  자격증 종류
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    value={certificateTypeFilter}
                    onChange={(event) => setCertificateTypeFilter(event.target.value)}
                  >
                    <option value="">전체</option>
                    {certificateTypes.map((item) => (
                      <option key={item.id} value={item.id}>{item.certificateTypeName}</option>
                    ))}
                  </select>
                </label>
              </div>
            </CardContent>
          </Card>

          <ActionButtons
            onSearch={() => void loadItems()}
            onNew={handleNew}
            onSave={handleSave}
            onDelete={handleDelete}
            searchDisabled={loading || !selectedEmployeeId}
            newDisabled={loading || !selectedEmployeeId}
            saveDisabled={loading || !selectedEmployeeId}
            deleteDisabled={loading || !selectedId}
          />

          {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card>
              <CardHeader>
                <CardTitle>보유 자격증</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>자격증</TableHead>
                      <TableHead>자격번호</TableHead>
                      <TableHead>발급기관</TableHead>
                      <TableHead>취득일</TableHead>
                      <TableHead>만료일</TableHead>
                      <TableHead>사용여부</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length ? items.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn("cursor-pointer", selectedId === item.id && "bg-muted")}
                        onClick={() => handleSelect(item)}
                      >
                        <TableCell className="font-medium">
                          {certificateTypeMap.get(item.certificateTypeId) ?? "-"}
                        </TableCell>
                        <TableCell>{item.certificateNo ?? "-"}</TableCell>
                        <TableCell>{certificateTypeIssuerMap.get(item.certificateTypeId) ?? "-"}</TableCell>
                        <TableCell>{item.acquiredDate ?? "-"}</TableCell>
                        <TableCell>{item.expiredDate ?? "-"}</TableCell>
                        <TableCell>{item.isActive ? "사용" : "미사용"}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {selectedEmployeeId ? "조회된 데이터가 없습니다." : "사원을 선택하세요."}
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
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  {selectedEmployee ? employeeLabel(selectedEmployee) : "사원 미선택"}
                </div>
                <label className="space-y-2 text-sm font-medium">
                  자격증 종류
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                    value={form.certificateTypeId}
                    onChange={(event) => handleChange("certificateTypeId", event.target.value)}
                    disabled={!selectedEmployeeId}
                  >
                    <option value="">선택</option>
                    {certificateTypes.map((item) => (
                      <option key={item.id} value={item.id}>{item.certificateTypeName}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  자격번호
                  <Input
                    value={form.certificateNo}
                    onChange={(event) => handleChange("certificateNo", event.target.value)}
                    disabled={!selectedEmployeeId}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    취득일
                    <Input
                      type="date"
                      value={form.acquiredDate}
                      onChange={(event) => handleChange("acquiredDate", event.target.value)}
                      disabled={!selectedEmployeeId}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    만료일
                    <Input
                      type="date"
                      value={form.expiredDate}
                      onChange={(event) => handleChange("expiredDate", event.target.value)}
                      disabled={!selectedEmployeeId}
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm font-medium">
                  메모
                  <Input
                    value={form.memo}
                    onChange={(event) => handleChange("memo", event.target.value)}
                    disabled={!selectedEmployeeId}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => handleChange("isActive", event.target.checked)}
                    disabled={!selectedEmployeeId}
                  />
                  사용
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
