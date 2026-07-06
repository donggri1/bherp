import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  NationalTaxInvoiceKind,
  NationalTaxInvoiceRow,
  ParsedNationalTaxInvoice,
  TaxInvoiceSummary,
} from './types/sungwon-tax-invoice-converter.types';

const SHEET_NAME = '세금계산서';
const TITLE_ROW_INDEX = 4;
const HEADER_ROW_INDEX = 5;
const DATA_START_ROW_INDEX = 6;

type CellValue = string | number | boolean | Date | null | undefined;

export function parseNationalTaxInvoiceWorkbook(
  file: Express.Multer.File,
  expectedKind: NationalTaxInvoiceKind,
  year: number,
  month: number,
): ParsedNationalTaxInvoice {
  const fileName = decodeUploadFileName(file.originalname);
  const workbook = XLSX.read(file.buffer, {
    type: 'buffer',
    cellDates: false,
    raw: false,
  });
  const sheet = workbook.Sheets[SHEET_NAME] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new BadRequestException(`${fileName} 파일에서 시트를 찾을 수 없습니다.`);
  }

  const rows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  const title = getText(rows[TITLE_ROW_INDEX]?.[0]);
  const detectedKind = detectKind(title);
  if (detectedKind !== expectedKind) {
    throw new BadRequestException(
      `${fileName} 파일은 ${
        expectedKind === 'sales' ? '매출' : '매입'
      } 국세청 파일이 아닙니다.`,
    );
  }

  validateHeader(rows[HEADER_ROW_INDEX], fileName);

  const headerSummary = parseHeaderSummary(rows);
  const allRows = rows
    .slice(DATA_START_ROW_INDEX)
    .map((row, index) => parseInvoiceRow(row, DATA_START_ROW_INDEX + index + 1))
    .filter((row): row is NationalTaxInvoiceRow => Boolean(row));
  const parsedRows = allRows.filter((row) => isTargetPeriod(row.issueDate, year, month));
  const rowSummary = summarizeRows(parsedRows);
  const warnings = buildParserWarnings(
    fileName,
    headerSummary,
    rowSummary,
    allRows.length,
    year,
    month,
  );

  return {
    kind: expectedKind,
    fileName,
    title,
    headerSummary,
    rowSummary,
    rows: parsedRows,
    warnings,
  };
}

function detectKind(title: string): NationalTaxInvoiceKind | null {
  if (title.includes('매출')) return 'sales';
  if (title.includes('매입')) return 'purchase';
  return null;
}

function validateHeader(row: CellValue[] | undefined, fileName: string) {
  const requiredByIndex: Record<number, string> = {
    0: '작성일자',
    1: '승인번호',
    14: '합계금액',
    15: '공급가액',
    16: '세액',
    21: '영수/청구 구분',
    26: '품목명',
  };

  for (const [index, expected] of Object.entries(requiredByIndex)) {
    const actual = getText(row?.[Number(index)]);
    if (actual !== expected) {
      throw new BadRequestException(
        `${fileName} 파일의 국세청 세금계산서 헤더 형식이 예상과 다릅니다.`,
      );
    }
  }
}

function parseHeaderSummary(rows: CellValue[][]): TaxInvoiceSummary {
  const summaryRow = rows[2] ?? [];
  return {
    count: 0,
    totalAmount: parseAmount(summaryRow[1]),
    supplyAmount: parseAmount(summaryRow[3]),
    taxAmount: parseAmount(summaryRow[5]),
  };
}

function parseInvoiceRow(
  row: CellValue[] | undefined,
  sourceRowNumber: number,
): NationalTaxInvoiceRow | null {
  if (!row) return null;

  const issueDate = normalizeDate(row[0]);
  const approvalNo = getText(row[1]);
  if (!issueDate && !approvalNo) return null;

  return {
    sourceRowNumber,
    issueDate,
    approvalNo,
    supplierBusinessNo: getText(row[4]),
    supplierName: getText(row[6]),
    supplierRepresentativeName: getText(row[7]),
    recipientBusinessNo: getText(row[9]),
    recipientName: getText(row[11]),
    recipientRepresentativeName: getText(row[12]),
    totalAmount: parseAmount(row[14]),
    supplyAmount: parseAmount(row[15]),
    taxAmount: parseAmount(row[16]),
    invoiceClassification: getText(row[17]),
    invoiceType: getText(row[18]),
    issueType: getText(row[19]),
    note: getText(row[20]),
    receiptClaimType: getText(row[21]),
    itemDate: normalizeDate(row[25]),
    itemName: getText(row[26]),
    itemSupplyAmount: parseAmount(row[30]),
    itemTaxAmount: parseAmount(row[31]),
  };
}

function summarizeRows(rows: NationalTaxInvoiceRow[]): TaxInvoiceSummary {
  return rows.reduce<TaxInvoiceSummary>(
    (summary, row) => ({
      count: summary.count + 1,
      supplyAmount: summary.supplyAmount + row.supplyAmount,
      taxAmount: summary.taxAmount + row.taxAmount,
      totalAmount: summary.totalAmount + row.totalAmount,
    }),
    { count: 0, supplyAmount: 0, taxAmount: 0, totalAmount: 0 },
  );
}

function buildParserWarnings(
  fileName: string,
  headerSummary: TaxInvoiceSummary,
  rowSummary: TaxInvoiceSummary,
  totalRowCount: number,
  year: number,
  month: number,
) {
  const warnings: string[] = [];
  if (totalRowCount > 0 && rowSummary.count === 0) {
    warnings.push(
      `${fileName} 파일에는 데이터가 있지만 ${year}년 ${month}월에 해당하는 행이 없습니다. 화면의 연도/월이 파일명 또는 작성일자와 맞는지 확인하세요.`,
    );
    return warnings;
  }
  if (
    headerSummary.totalAmount !== rowSummary.totalAmount ||
    headerSummary.supplyAmount !== rowSummary.supplyAmount ||
    headerSummary.taxAmount !== rowSummary.taxAmount
  ) {
    warnings.push(
      `${fileName} 파일의 상단 합계와 선택 기간 행 합계가 다릅니다. 다른 기간 행이 섞였는지 확인하세요.`,
    );
  }
  return warnings;
}

export function parseAmount(value: CellValue): number {
  if (typeof value === 'number') return value;
  const text = getText(value).replace(/,/g, '');
  if (!text) return 0;
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeDate(value: CellValue): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const text = getText(value);
  const match = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (!match) return text;
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function isTargetPeriod(date: string, year: number, month: number) {
  const match = date.match(/^(\d{4})-(\d{2})-/);
  if (!match) return true;
  return Number(match[1]) === year && Number(match[2]) === month;
}

function getText(value: CellValue): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function decodeUploadFileName(fileName: string) {
  if (!/[ìíëê]/.test(fileName)) return fileName;
  return Buffer.from(fileName, 'latin1').toString('utf8');
}
