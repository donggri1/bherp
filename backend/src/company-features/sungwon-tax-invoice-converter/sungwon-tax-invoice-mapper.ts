import {
  ConvertedTaxInvoiceData,
  ConvertedTaxInvoiceRow,
  NationalTaxInvoiceKind,
  NationalTaxInvoiceRow,
  ParsedNationalTaxInvoice,
  TaxInvoicePreview,
  TaxInvoicePreviewRow,
  TaxInvoiceSummary,
} from './types/sungwon-tax-invoice-converter.types';

export function buildConvertedTaxInvoiceData(
  year: number,
  month: number,
  sales: ParsedNationalTaxInvoice,
  purchases: ParsedNationalTaxInvoice,
): ConvertedTaxInvoiceData {
  const salesRows = mapRows('sales', sales.rows);
  const purchaseRows = mapRows('purchase', purchases.rows);
  const warnings = [
    ...sales.warnings,
    ...purchases.warnings,
    ...buildMappingWarnings('매출', salesRows),
    ...buildMappingWarnings('매입', purchaseRows),
  ];

  if (purchaseRows.length) {
    warnings.push(
      '매입장에는 국세청 자료에 없는 수기/반복 항목이 있을 수 있습니다. 샘플 기준으로 블루링크서비스, 기장료 같은 항목은 별도 입력이 필요합니다.',
    );
  }
  if ([...salesRows, ...purchaseRows].some((row) => row.paymentStatus === '외상')) {
    warnings.push(
      '입금/외상, 입금일, 입금액은 국세청 자료만으로 확정할 수 없어 기본값이 적용되었습니다.',
    );
  }

  return {
    year,
    month,
    sales,
    purchases,
    salesRows,
    purchaseRows,
    warnings: Array.from(new Set(warnings)),
  };
}

export function buildTaxInvoicePreview(data: ConvertedTaxInvoiceData): TaxInvoicePreview {
  return {
    year: data.year,
    month: data.month,
    sales: buildPreviewSummary(data.sales.rowSummary, data.sales.headerSummary),
    purchases: buildPreviewSummary(data.purchases.rowSummary, data.purchases.headerSummary),
    warnings: data.warnings,
    rows: {
      sales: data.salesRows.map(toPreviewRow),
      purchases: data.purchaseRows.map(toPreviewRow),
    },
  };
}

function mapRows(kind: NationalTaxInvoiceKind, rows: NationalTaxInvoiceRow[]) {
  return [...rows].sort(compareInvoiceRows).map((row, index) => mapRow(kind, row, index + 1));
}

function compareInvoiceRows(left: NationalTaxInvoiceRow, right: NationalTaxInvoiceRow) {
  const byDate = left.issueDate.localeCompare(right.issueDate);
  if (byDate !== 0) return byDate;
  return left.sourceRowNumber - right.sourceRowNumber;
}

function mapRow(
  kind: NationalTaxInvoiceKind,
  row: NationalTaxInvoiceRow,
  sequence: number,
): ConvertedTaxInvoiceRow {
  const constructionNo = kind === 'sales' ? extractConstructionNo(row.note) : '';
  const category =
    kind === 'sales'
      ? inferSalesCategory(row, constructionNo)
      : inferPurchaseCategory(row);
  const partnerName = normalizePartnerName(
    kind === 'sales' ? row.recipientName : row.supplierName,
    kind === 'sales'
      ? row.recipientRepresentativeName
      : row.supplierRepresentativeName,
  );
  const payment = inferPayment(row);
  const warnings = buildRowWarnings(kind, row, category, constructionNo, payment.status);

  return {
    kind,
    sourceRowNumber: row.sourceRowNumber,
    quarter: quarterOf(row.issueDate),
    sequence,
    date: row.issueDate,
    category,
    constructionNo,
    partnerName,
    description: row.itemName,
    supplyAmount: row.supplyAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    invoiceKind: invoiceKind(row.invoiceClassification),
    paymentStatus: payment.status,
    paymentDate: payment.date,
    paidAmount: payment.paidAmount,
    receivableAmount: payment.receivableAmount,
    memo: inferMemo(kind, row, constructionNo),
    warnings,
  };
}

function buildPreviewSummary(
  rowSummary: TaxInvoiceSummary,
  headerSummary: TaxInvoiceSummary,
) {
  return {
    ...rowSummary,
    headerSummary,
    matchesHeader:
      rowSummary.supplyAmount === headerSummary.supplyAmount &&
      rowSummary.taxAmount === headerSummary.taxAmount &&
      rowSummary.totalAmount === headerSummary.totalAmount,
  };
}

function toPreviewRow(row: ConvertedTaxInvoiceRow): TaxInvoicePreviewRow {
  return {
    kind: row.kind,
    rowNo: row.sequence,
    date: row.date,
    category: row.category,
    constructionNo: row.constructionNo || undefined,
    partnerName: row.partnerName,
    description: row.description,
    supplyAmount: row.supplyAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    paymentStatus: row.paymentStatus,
    warningCount: row.warnings.length,
  };
}

function buildMappingWarnings(label: string, rows: ConvertedTaxInvoiceRow[]) {
  const warnings: string[] = [];
  const unclassified = rows.filter((row) => row.category === '미분류').length;
  if (unclassified > 0) {
    warnings.push(`${label} ${unclassified}건은 종목을 자동 판정하지 못했습니다.`);
  }
  const missingConstructionNo = rows.filter(
    (row) => row.kind === 'sales' && row.partnerName.includes('한국전력공사') && !row.constructionNo,
  ).length;
  if (missingConstructionNo > 0) {
    warnings.push(`한국전력공사 매출 ${missingConstructionNo}건은 공사번호를 추출하지 못했습니다.`);
  }
  return warnings;
}

function buildRowWarnings(
  kind: NationalTaxInvoiceKind,
  row: NationalTaxInvoiceRow,
  category: string,
  constructionNo: string,
  paymentStatus: string,
) {
  const warnings: string[] = [];
  if (category === '미분류') warnings.push('종목 확인 필요');
  if (kind === 'sales' && row.recipientName.includes('한국전력공사') && !constructionNo) {
    warnings.push('공사번호 확인 필요');
  }
  if (paymentStatus === '외상') warnings.push('입금 상태 확인 필요');
  return warnings;
}

function quarterOf(date: string) {
  const month = Number(date.slice(5, 7));
  if (month <= 3) return '1분기';
  if (month <= 6) return '2분기';
  if (month <= 9) return '3분기';
  return '4분기';
}

function inferSalesCategory(row: NationalTaxInvoiceRow, constructionNo: string) {
  const text = `${row.recipientName} ${row.note} ${row.itemName}`;
  if (row.recipientName.includes('한국전력공사') || constructionNo) return '단가(2025)';
  if (/소방/.test(text)) return '소방';
  if (/임시|전기공사|kw|KW|신축|설치/.test(text)) return '내선';
  return '미분류';
}

function inferPurchaseCategory(row: NationalTaxInvoiceRow) {
  const text = `${row.supplierName} ${row.supplierRepresentativeName} ${row.itemName} ${row.note}`;
  if (/케이티|현대자동차|세무법인|임대|블루링크|기장료/.test(text)) return '경비';
  if (/우신건기|건설기계/.test(text)) return '건설기계';
  if (/장비|바켓|고소작업차|화물|운수/.test(text)) return '건설화물';
  if (/분전반|감지기|철선|강연선|자재/.test(text)) return '자재';
  if (/방염복/.test(text)) return '경비';
  return '미분류';
}

export function extractConstructionNo(note: string) {
  const compact = note.replace(/\s/g, '');
  const match = compact.match(/공사번호[:：]?(\d{4})(\d{4})(\d{4})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function normalizePartnerName(name: string, representativeName: string) {
  const normalizedName = name
    .replace(/\(주\)/g, '㈜')
    .replace(/주식회사\s*/g, '㈜')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedRepresentative = representativeName
    .replace(/외(\d+)명/g, '외 $1 명')
    .replace(/\s+/g, ' ')
    .trim();
  return [normalizedName, normalizedRepresentative].filter(Boolean).join(' ');
}

function inferPayment(row: NationalTaxInvoiceRow) {
  const isPaid = row.receiptClaimType === '영수';
  return {
    status: isPaid ? '입금' : '외상',
    date: isPaid ? row.issueDate : '',
    paidAmount: isPaid ? row.totalAmount : null,
    receivableAmount: isPaid ? 0 : row.totalAmount,
  };
}

function invoiceKind(classification: string) {
  if (classification.includes('계산서') && !classification.includes('세금')) {
    return '전자계산서';
  }
  return '전자';
}

function inferMemo(kind: NationalTaxInvoiceKind, row: NationalTaxInvoiceRow, constructionNo: string) {
  if (kind === 'sales' && constructionNo) return '성원단가건';
  if (kind === 'purchase' && /장비|바켓|고소작업차|화물|운수/.test(row.itemName)) {
    return '성원단가건';
  }
  return '';
}
