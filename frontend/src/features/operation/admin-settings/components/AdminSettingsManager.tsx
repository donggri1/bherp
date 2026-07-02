"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
import { getAdminSettings, updateAdminSettings } from "../api/admin-settings.api";
import type { CertificateExpiryAlertRule } from "../types/admin-settings.types";

const emptyRule: CertificateExpiryAlertRule = { amount: 1, unit: "day" };

export function AdminSettingsManager() {
  const router = useRouter();
  const [rules, setRules] = useState<CertificateExpiryAlertRule[]>([]);
  const [settingType, setSettingType] = useState("certificate-expiry");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getAdminSettings();
      setRules(result.certificateExpiryAlertRules);
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

  const handleRuleChange = <K extends keyof CertificateExpiryAlertRule>(
    index: number,
    key: K,
    value: CertificateExpiryAlertRule[K],
  ) => {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [key]: value } : rule,
      ),
    );
  };

  const handleNew = () => {
    setRules((current) => [...current, emptyRule]);
    setMessage("");
  };

  const handleDelete = (index: number) => {
    setRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index));
  };

  const handleSave = async () => {
    const normalizedRules = rules
      .map((rule) => ({ amount: Number(rule.amount), unit: rule.unit }))
      .filter((rule) => rule.amount >= 1);

    if (!normalizedRules.length) {
      setMessage("알람 기준은 1개 이상 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await updateAdminSettings(normalizedRules);
      setRules(result.certificateExpiryAlertRules);
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="환경설정" description="관리자 설정을 등록하고 관리합니다." />

      <Card>
        <CardHeader>
          <CardTitle>검색조건</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              설정구분
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={settingType}
                onChange={(event) => setSettingType(event.target.value)}
              >
                <option value="certificate-expiry">자격증 만료 알람</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <ActionButtons
        onSearch={loadItems}
        onNew={handleNew}
        onSave={handleSave}
        searchDisabled={loading}
        newDisabled={loading || settingType !== "certificate-expiry"}
        saveDisabled={loading}
        deleteDisabled
      />

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>자격증 만료 알람 기준</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>알람시점</TableHead>
                <TableHead>단위</TableHead>
                <TableHead>표시예시</TableHead>
                <TableHead className="w-20">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length ? rules.map((rule, index) => (
                <TableRow key={`${rule.amount}-${rule.unit}-${index}`}>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={rule.amount}
                      onChange={(event) =>
                        handleRuleChange(index, "amount", Number(event.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                      value={rule.unit}
                      onChange={(event) =>
                        handleRuleChange(index, "unit", event.target.value as CertificateExpiryAlertRule["unit"])
                      }
                    >
                      <option value="hour">시간 전</option>
                      <option value="day">일 전</option>
                    </select>
                  </TableCell>
                  <TableCell className="font-medium">
                    만료 {rule.amount}{rule.unit === "hour" ? "시간" : "일"} 전
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(index)}
                      disabled={loading}
                      aria-label="알람 기준 삭제"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    등록된 알람 기준이 없습니다.
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
