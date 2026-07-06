"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
import {
  downloadSungwonTaxInvoice,
  previewSungwonTaxInvoice,
} from "../api/sungwon-tax-invoice-converter.api";
import type {
  TaxInvoicePreview,
  TaxInvoicePreviewRow,
  TaxInvoicePreviewSummary,
} from "../types/sungwon-tax-invoice-converter.types";

function currentYear() {
  return new Date().getFullYear();
}

function currentMonth() {
  return new Date().getMonth() + 1;
}

function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function fileLabel(file: File | null) {
  return file ? `${file.name} (${formatAmount(file.size)} bytes)` : "선택된 파일 없음";
}

function inferMonthFromFileName(file: File | null) {
  const match = file?.name.match(/(\d{1,2})월/);
  if (!match) return null;
  const value = Number(match[1]);
  return value >= 1 && value <= 12 ? value : null;
}

export function SungwonTaxInvoiceConverterManager() {
  const router = useRouter();
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TaxInvoicePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmit = Boolean(salesFile && purchaseFile && year && month);
  const previewRows = useMemo(() => {
    if (!preview) return [];
    return [...preview.rows.sales, ...preview.rows.purchases].slice(0, 20);
  }, [preview]);

  const buildRequest = () => {
    if (!salesFile || !purchaseFile) {
      throw new Error("매출/매입 국세청 파일을 모두 선택하세요.");
    }
    return { year, month, salesFile, purchaseFile };
  };

  const handlePreview = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await previewSungwonTaxInvoice(buildRequest());
      setPreview(result);
      setMessage("미리보기를 생성했습니다.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "미리보기에 실패했습니다.";
      setMessage(text);
      if (text.includes("로그인") || text.includes("인증")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await downloadSungwonTaxInvoice(buildRequest());
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("변환 파일을 생성했습니다.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "다운로드에 실패했습니다.";
      setMessage(text);
      if (text.includes("로그인") || text.includes("인증")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSalesFile(null);
    setPurchaseFile(null);
    setPreview(null);
    setMessage("");
  };

  const updateFile = (kind: "sales" | "purchase", file: File | null) => {
    if (kind === "sales") setSalesFile(file);
    if (kind === "purchase") setPurchaseFile(file);
    const inferredMonth = inferMonthFromFileName(file);
    if (inferredMonth) setMonth(inferredMonth);
    setPreview(null);
    setMessage(inferredMonth ? `파일명에서 ${inferredMonth}월을 감지했습니다.` : "");
  };

  return (
    <>
      <PageHeader
        title="세금계산서변환"
        description="국세청 매출/매입 Excel 자료를 성원전기 세금계산서 양식으로 변환합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>변환 기준</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[140px_120px_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2 text-sm font-medium">
              연도
              <Input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              월
              <Input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              />
            </label>
            <FileInput
              label="국세청 매출 파일"
              file={salesFile}
              onChange={(file) => updateFile("sales", file)}
            />
            <FileInput
              label="국세청 매입 파일"
              file={purchaseFile}
              onChange={(file) => updateFile("purchase", file)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {salesFile || purchaseFile
            ? `${fileLabel(salesFile)} / ${fileLabel(purchaseFile)}`
            : "매출 파일과 매입 파일을 선택하세요."}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={loading}>
            <RotateCcw className="size-4" aria-hidden />
            초기화
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview} disabled={loading || !canSubmit}>
            <Eye className="size-4" aria-hidden />
            미리보기
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={loading || !canSubmit}>
            <Download className="size-4" aria-hidden />
            변환 파일 다운로드
          </Button>
        </div>
      </div>

      {message ? <div className="rounded-md border bg-background px-4 py-3 text-sm">{message}</div> : null}

      {preview ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryPanel title="매출" summary={preview.sales} />
            <SummaryPanel title="매입" summary={preview.purchases} />
          </div>

          {preview.warnings.length ? (
            <Card>
              <CardHeader>
                <CardTitle>확인 필요</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.warnings.map((warning) => (
                  <div key={warning} className="flex gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 size-4 text-amber-600" aria-hidden />
                    <span>{warning}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>변환 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto p-0">
              <PreviewTable rows={previewRows} />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="rounded-md border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
          <FileSpreadsheet className="mx-auto mb-3 size-8" aria-hidden />
          미리보기 결과가 없습니다.
        </div>
      )}
    </>
  );
}

type FileInputProps = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
};

function FileInput({ label, file, onChange }: FileInputProps) {
  return (
    <label className="space-y-2 text-sm font-medium">
      {label}
      <Input
        type="file"
        accept=".xls,.xlsx"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <span className="block truncate text-xs font-normal text-muted-foreground">
        {fileLabel(file)}
      </span>
    </label>
  );
}

function SummaryPanel({
  title,
  summary,
}: {
  title: string;
  summary: TaxInvoicePreviewSummary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="건수" value={`${formatAmount(summary.count)}건`} />
          <Metric label="공급가액" value={formatAmount(summary.supplyAmount)} />
          <Metric label="세액" value={formatAmount(summary.taxAmount)} />
          <Metric label="합계" value={formatAmount(summary.totalAmount)} />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          국세청 상단 합계 {summary.matchesHeader ? "일치" : "불일치"}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function PreviewTable({ rows }: { rows: TaxInvoicePreviewRow[] }) {
  return (
    <Table className="min-w-[1080px]">
      <TableHeader>
        <TableRow>
          <TableHead>구분</TableHead>
          <TableHead>일자</TableHead>
          <TableHead>종목</TableHead>
          <TableHead>공사번호</TableHead>
          <TableHead>거래처</TableHead>
          <TableHead>내역</TableHead>
          <TableHead className="text-right">공급가액</TableHead>
          <TableHead className="text-right">세액</TableHead>
          <TableHead className="text-right">합계</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={`${row.kind}-${row.rowNo}`}>
              <TableCell className="whitespace-nowrap">{row.kind === "sales" ? "매출" : "매입"}</TableCell>
              <TableCell className="whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="whitespace-nowrap">{row.category}</TableCell>
              <TableCell className="whitespace-nowrap">{row.constructionNo ?? "-"}</TableCell>
              <TableCell className="whitespace-nowrap">{row.partnerName}</TableCell>
              <TableCell className="whitespace-nowrap">{row.description}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatAmount(row.supplyAmount)}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatAmount(row.taxAmount)}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatAmount(row.totalAmount)}</TableCell>
              <TableCell className="whitespace-nowrap">{row.warningCount ? `확인 ${row.warningCount}` : row.paymentStatus}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
              변환 대상 행이 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
