import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { SUNGWON_COMPANY_DISPLAY_NAME } from './constants/sungwon-tax-invoice-converter.constants';
import {
  ConvertedTaxInvoiceData,
  ConvertedTaxInvoiceRow,
  TaxInvoiceSummary,
} from './types/sungwon-tax-invoice-converter.types';

const COLOR_TITLE = 'FFC0C0C0';
const COLOR_CONFIRMED = 'FFFFFF99';
const COLOR_CONTRACT_HEADER = 'FFFFCC00';
const COLOR_WHITE = 'FFFFFFFF';
const COLOR_BLACK = 'FF000000';
const COLOR_BLUE = 'FF0000FF';
const COLOR_RED = 'FFFF0000';
const COLOR_CYAN = 'FF00B0F0';
const COLOR_YELLOW = 'FFFFFF00';
const COLOR_LIGHT_CYAN = 'FFCCFFFF';
const COLOR_UNIT_PRICE = 'FFB1A0C7';
const COLOR_PURCHASE_SUBCONTRACT = 'FFCCC0DA';
const COLOR_PURCHASE_SUBCONTRACT_CALC = 'FFE4DFEC';
const COLOR_PURCHASE_MACHINE = 'FFD8E4BC';
const COLOR_PURCHASE_CARGO = 'FFFCD5B4';
const COLOR_PURCHASE_RENTAL = 'FFB7DEE8';
const MONEY_FORMAT = '#,##0';

const SALES_CATEGORIES = [
  '외선',
  '내선',
  '내선&소방',
  '총가',
  '소방',
  '단가(여주)',
  '자산',
  '기타',
  '단가(2025)마',
  '단가(2025)',
];

const PURCHASE_CATEGORIES = [
  '자재',
  '자산',
  '경비',
  '외주비',
  '건설기계',
  '건설화물',
  '장비임대',
  '운반비',
  '장비대',
  '외주장비',
  '중기대',
];

const SALES_CATEGORY_COLORS: Record<string, string> = {
  '내선&소방': COLOR_RED,
  총가: COLOR_CYAN,
  소방: COLOR_CONTRACT_HEADER,
  자산: COLOR_YELLOW,
  '단가(2025)마': COLOR_UNIT_PRICE,
  '단가(2025)': COLOR_UNIT_PRICE,
};

const PURCHASE_LEDGER_CATEGORY_COLORS: Record<string, string> = {
  자산: COLOR_YELLOW,
  외주비: COLOR_PURCHASE_SUBCONTRACT,
  건설기계: COLOR_PURCHASE_MACHINE,
  건설화물: COLOR_PURCHASE_CARGO,
  장비임대: COLOR_PURCHASE_RENTAL,
};

const PURCHASE_CATEGORY_COLORS: Record<string, string> = {
  ...PURCHASE_LEDGER_CATEGORY_COLORS,
  외주비: COLOR_PURCHASE_SUBCONTRACT_CALC,
};

type CategoryKind = 'sales' | 'purchase';

@Injectable()
export class SungwonTaxInvoiceWorkbookBuilder {
  async build(data: ConvertedTaxInvoiceData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BHERP';
    workbook.created = new Date();

    this.buildSalesSheet(workbook, data);
    this.buildPurchaseSheet(workbook, data);
    this.buildSummarySheet(workbook, data);
    this.buildPurchaseInvoiceSheet(workbook, data);
    this.buildCalculationSheet(workbook, data);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private buildSalesSheet(workbook: ExcelJS.Workbook, data: ConvertedTaxInvoiceData) {
    const rows = sortConvertedRows(data.salesRows);
    const sheet = workbook.addWorksheet('매출장', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    sheet.columns = [
      { width: 10 },
      { width: 8 },
      { width: 11 },
      { width: 13 },
      { width: 16 },
      { width: 24 },
      { width: 42 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 10 },
      { width: 10 },
      { width: 11 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 4 },
      { width: 11 },
      { width: 14 },
      { width: 24 },
      { width: 14 },
      { width: 16 },
      { width: 12 },
      { width: 16 },
      { width: 26 },
      { width: 4 },
    ];

    this.writeTitle(sheet, `${data.year}년 매출장`, 26);
    this.writeHeader(sheet, 3, [
      '분기',
      '기존',
      '일자',
      '종목',
      '공사번호',
      '거래처',
      '내역',
      '공급가액',
      '세액',
      '합계',
      '종류',
      '구분',
      '입금일',
      '입금액',
      '미수금액',
      '비고',
      '',
      '계약일',
      '공사기간',
      '공사장소',
      '발주담당자',
      '발주자연락처',
      '개시신고',
      '보증서발행 유무',
      '→계약금액 5백만원 이상 발행    하도급공사 개시신고X',
      '',
    ]);
    this.styleSalesContractHeader(sheet);

    rows.forEach((row, index) => {
      sheet.addRow([
        row.quarter,
        index + 1,
        formatShortDate(row.date),
        displayCategory(row.category),
        row.constructionNo,
        row.partnerName,
        row.description,
        row.supplyAmount,
        row.taxAmount,
        row.totalAmount,
        row.invoiceKind,
        row.paymentStatus,
        formatShortDate(row.paymentDate),
        row.paidAmount,
        row.receivableAmount,
        row.memo,
      ]);
    });

    const dataEndRow = Math.max(sheet.rowCount, 3);
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: dataEndRow, column: 16 },
    };
    this.styleDataArea(sheet, 4, dataEndRow, 26, [8, 9, 10, 14, 15], [6, 7, 25]);
    this.applyLedgerSemanticColors(sheet, 4, dataEndRow, 4, 12, 'sales');
    this.appendSalesFooter(sheet, rows);
  }

  private buildPurchaseSheet(workbook: ExcelJS.Workbook, data: ConvertedTaxInvoiceData) {
    const rows = sortConvertedRows(data.purchaseRows);
    const sheet = workbook.addWorksheet('매입장', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    sheet.columns = [
      { width: 10 },
      { width: 8 },
      { width: 11 },
      { width: 13 },
      { width: 28 },
      { width: 42 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 10 },
      { width: 10 },
      { width: 11 },
      { width: 14 },
      { width: 14 },
      { width: 18 },
      { width: 18 },
    ];

    this.writeTitle(sheet, `${data.year}년 매입장`, 16);
    this.writeHeader(sheet, 3, [
      '분기',
      '기존',
      '일자',
      '종목',
      '거래처',
      '내역',
      '공급가액',
      '세액',
      '합계',
      '종류',
      '구분',
      '입금일',
      '입금액',
      '미수금액',
      '비고',
      '',
    ]);

    rows.forEach((row, index) => {
      sheet.addRow([
        row.quarter,
        index + 1,
        formatShortDate(row.date),
        displayCategory(row.category),
        row.partnerName,
        row.description,
        row.supplyAmount,
        row.taxAmount,
        row.totalAmount,
        row.invoiceKind,
        row.paymentStatus,
        formatShortDate(row.paymentDate),
        row.paidAmount,
        row.receivableAmount,
        row.memo,
      ]);
    });

    const dataEndRow = Math.max(sheet.rowCount, 3);
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: dataEndRow, column: 15 },
    };
    this.styleDataArea(sheet, 4, dataEndRow, 16, [7, 8, 9, 13, 14], [5, 6]);
    this.applyLedgerSemanticColors(sheet, 4, dataEndRow, 4, 11, 'purchase');
    this.appendPurchaseFooter(sheet, rows);
  }

  private buildSummarySheet(workbook: ExcelJS.Workbook, data: ConvertedTaxInvoiceData) {
    const sheet = workbook.addWorksheet('요약', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });
    sheet.columns = [
      { width: 12 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 10 },
      { width: 14 },
      { width: 32 },
    ];

    this.writeTitle(sheet, `${data.year}년 매출.매입 요약`, 13);
    this.writeSummaryHeaders(sheet);

    buildQuarterRows(data.salesRows, data.purchaseRows).forEach((row) => {
      const diff = subtractSummary(row.sales, row.purchases);
      sheet.addRow([
        row.label,
        row.sales.supplyAmount,
        row.sales.taxAmount,
        row.sales.totalAmount,
        row.purchases.supplyAmount,
        row.purchases.taxAmount,
        row.purchases.totalAmount,
        diff.supplyAmount,
        diff.taxAmount,
        diff.totalAmount,
        row.sales.supplyAmount ? row.purchases.supplyAmount / row.sales.supplyAmount : null,
        diff.taxAmount,
        '',
      ]);
    });

    this.styleDataArea(sheet, 5, sheet.rowCount, 13, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12], []);
    sheet.getColumn(11).numFmt = '0.00';
    for (let rowNumber = 5; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const label = String(sheet.getCell(rowNumber, 1).value ?? '');
      if (label.includes('확정')) this.fillRow(sheet, rowNumber, 13, COLOR_CONFIRMED);
      if (label === '년계') this.fillRow(sheet, rowNumber, 13, COLOR_TITLE);
    }
    this.applySummaryGroupBorders(sheet, 3, sheet.rowCount);
  }

  private buildPurchaseInvoiceSheet(workbook: ExcelJS.Workbook, data: ConvertedTaxInvoiceData) {
    const sheet = workbook.addWorksheet('계산서(매입)', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });
    sheet.columns = [
      { width: 10 },
      { width: 8 },
      { width: 11 },
      { width: 28 },
      { width: 48 },
      { width: 14 },
      { width: 14 },
      { width: 10 },
      { width: 11 },
      { width: 14 },
      { width: 14 },
      { width: 18 },
    ];
    this.writeTitle(sheet, `${data.year}년 계산서(매입)`, 12);
    this.writeHeader(sheet, 3, [
      '분기',
      '기준',
      '일자',
      '공급자',
      '내역',
      '공급가액',
      '종류',
      '구분',
      '입금일',
      '입금액',
      '미수금액',
      '비 고',
    ]);
    sheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 111, column: 12 },
    };
    sheet.addRow(['요약', '', '', '', '', 0, '', '', '', '', 0, '']);
    this.styleDataArea(sheet, 4, sheet.rowCount, 12, [6, 10, 11], [4, 5, 12]);
  }

  private buildCalculationSheet(workbook: ExcelJS.Workbook, data: ConvertedTaxInvoiceData) {
    const sheet = workbook.addWorksheet('계산');
    sheet.columns = [
      { width: 10 },
      { width: 10 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 22 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
    ];
    sheet.getCell('A1').value = SUNGWON_COMPANY_DISPLAY_NAME;
    sheet.getCell('A1').font = { bold: true, color: { argb: COLOR_BLUE }, size: 12 };
    sheet.getCell('A1').border = blackBorder('thin');

    this.appendReceivableTable(sheet, '외상 매출금 현황', data.salesRows, '미수금액');
    sheet.addRow([]);
    this.appendCategoryTable(sheet, '종목별 실적 현황', data.salesRows, SALES_CATEGORIES, '종목', 'sales');
    sheet.addRow([]);
    sheet.addRow([]);
    this.appendReceivableTable(sheet, '외상 매입금 현황', data.purchaseRows, '외상대');
    sheet.addRow([]);
    this.appendCategoryTable(sheet, '계정별 현황', data.purchaseRows, PURCHASE_CATEGORIES, '종목', 'purchase');
  }

  private appendSalesFooter(sheet: ExcelJS.Worksheet, rows: ConvertedTaxInvoiceRow[]) {
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      '요약',
      '',
      '',
      '',
      '',
      '',
      '',
      sum(rows, 'supplyAmount'),
      sum(rows, 'taxAmount'),
      sum(rows, 'totalAmount'),
      '',
      '',
      '',
      sumNullable(rows, 'paidAmount'),
      sum(rows, 'receivableAmount'),
      '',
    ]);
    this.styleTotalRow(summaryRow, 16, [8, 9, 10, 14, 15]);
    sheet.addRow([]);
    this.appendReceivableTable(sheet, '외상 매출금 현황', rows, '미수금액', 7, '<세금계산서 미접수>');
    this.appendCategoryTable(sheet, '종목별 실적 현황', rows, SALES_CATEGORIES, '종목', 'sales');
  }

  private appendPurchaseFooter(sheet: ExcelJS.Worksheet, rows: ConvertedTaxInvoiceRow[]) {
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      '요약',
      '',
      '',
      '',
      '',
      '',
      sum(rows, 'supplyAmount'),
      sum(rows, 'taxAmount'),
      sum(rows, 'totalAmount'),
      '',
      '',
      '',
      sumNullable(rows, 'paidAmount'),
      sum(rows, 'receivableAmount'),
      '',
    ]);
    this.styleTotalRow(summaryRow, 15, [7, 8, 9, 13, 14]);
    sheet.addRow([]);
    this.appendReceivableTable(sheet, '외상 매입금 현황', rows, '외상대');
    this.appendCategoryTable(sheet, '계정별 현황', rows, PURCHASE_CATEGORIES, '종목', 'purchase');
  }

  private appendReceivableTable(
    sheet: ExcelJS.Worksheet,
    title: string,
    rows: ConvertedTaxInvoiceRow[],
    balanceLabel: string,
    maxColumn = 8,
    sideNote = '',
  ) {
    const titleRow = sheet.addRow([title]);
    this.styleSectionTitle(sheet, titleRow.number, maxColumn);
    if (sideNote) {
      sheet.getCell(titleRow.number, 9).value = sideNote;
      sheet.getCell(titleRow.number, 9).font = { bold: true };
    }

    const headerRowNumber = sheet.rowCount + 1;
    this.writeHeader(sheet, headerRowNumber, [
      'No.',
      '분기',
      '공급가액',
      '세액',
      '합계금액',
      '입금액',
      balanceLabel,
      '비고',
    ]);

    const quarters = ['1분기', '2분기', '3분기', '4분기'];
    quarters.forEach((quarter, index) => {
      const quarterRows = rows.filter((row) => row.quarter === quarter);
      sheet.addRow([
        index + 1,
        quarter,
        sum(quarterRows, 'supplyAmount'),
        sum(quarterRows, 'taxAmount'),
        sum(quarterRows, 'totalAmount'),
        sumNullable(quarterRows, 'paidAmount'),
        sum(quarterRows, 'receivableAmount'),
        '',
      ]);
    });
    const totalRow = sheet.addRow([
      '합계',
      '',
      sum(rows, 'supplyAmount'),
      sum(rows, 'taxAmount'),
      sum(rows, 'totalAmount'),
      sumNullable(rows, 'paidAmount'),
      sum(rows, 'receivableAmount'),
      '',
    ]);
    this.styleDataArea(sheet, headerRowNumber + 1, sheet.rowCount, maxColumn, [3, 4, 5, 6, 7], []);
    this.styleTotalRow(totalRow, maxColumn, [3, 4, 5, 6, 7]);
    this.fillCells(totalRow, [5], COLOR_YELLOW);
    this.fillCells(totalRow, [7], COLOR_LIGHT_CYAN);
  }

  private appendCategoryTable(
    sheet: ExcelJS.Worksheet,
    title: string,
    rows: ConvertedTaxInvoiceRow[],
    baseCategories: string[],
    categoryHeader: string,
    kind: CategoryKind,
  ) {
    const titleRow = sheet.addRow([title]);
    this.styleSectionTitle(sheet, titleRow.number, 8);

    const headerRowNumber = sheet.rowCount + 1;
    this.writeHeader(sheet, headerRowNumber, [
      'No.',
      '',
      '',
      categoryHeader,
      '공급가액',
      '세액',
      '합계',
      '비고',
    ]);

    const categories = mergeCategories(baseCategories, rows);
    categories.forEach((category, index) => {
      const categoryRows = rows.filter((row) => normalizedCategory(row.category) === category);
      sheet.addRow([
        index + 1,
        '',
        '',
        category,
        sum(categoryRows, 'supplyAmount'),
        sum(categoryRows, 'taxAmount'),
        sum(categoryRows, 'totalAmount'),
        categoryMemo(category),
      ]);
    });
    const totalRow = sheet.addRow([
      '합계',
      '',
      '',
      '',
      sum(rows, 'supplyAmount'),
      sum(rows, 'taxAmount'),
      sum(rows, 'totalAmount'),
      '',
    ]);
    this.styleDataArea(sheet, headerRowNumber + 1, sheet.rowCount, 8, [5, 6, 7], [4, 8]);
    this.applyCategoryTableColors(sheet, headerRowNumber + 1, sheet.rowCount - 1, kind);
    this.styleTotalRow(totalRow, 8, [5, 6, 7]);
    this.fillCells(totalRow, [7], COLOR_YELLOW);
  }

  private writeTitle(sheet: ExcelJS.Worksheet, title: string, columnCount: number) {
    sheet.mergeCells(1, 1, 1, columnCount);
    sheet.getCell(1, 1).value = ` ${title} `;
    sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: COLOR_BLACK } };
    sheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    this.styleRange(sheet, 1, 1, 1, columnCount, {
      fill: COLOR_TITLE,
      borderStyle: 'thin',
    });

    sheet.mergeCells(2, 1, 2, columnCount);
    sheet.getCell(2, 1).value = SUNGWON_COMPANY_DISPLAY_NAME;
    sheet.getCell(2, 1).font = { bold: true, color: { argb: COLOR_BLUE } };
    sheet.getCell(2, 1).alignment = { horizontal: 'left', vertical: 'middle' };
    this.styleRange(sheet, 2, 1, 2, columnCount, {
      fill: COLOR_WHITE,
      borderStyle: 'thin',
    });
  }

  private writeSummaryHeaders(sheet: ExcelJS.Worksheet) {
    sheet.mergeCells(3, 1, 4, 1);
    sheet.mergeCells(3, 2, 3, 4);
    sheet.mergeCells(3, 5, 3, 7);
    sheet.mergeCells(3, 8, 3, 10);
    sheet.mergeCells(3, 11, 4, 11);
    sheet.mergeCells(3, 12, 4, 12);
    sheet.mergeCells(3, 13, 4, 13);
    sheet.getCell(3, 1).value = '분기';
    sheet.getCell(3, 2).value = '매출';
    sheet.getCell(3, 5).value = '매입';
    sheet.getCell(3, 8).value = '차액';
    sheet.getCell(3, 11).value = '부가율';
    sheet.getCell(3, 12).value = '부가가치세';
    sheet.getCell(3, 13).value = '비고';
    sheet.getRow(4).values = [
      '',
      '공급가액',
      '세액',
      '합계',
      '공급가액',
      '세액',
      '합계',
      '공급가액',
      '세액',
      '합계',
      '',
      '',
      '',
    ];
    this.styleRange(sheet, 3, 1, 4, 13, {
      fill: COLOR_WHITE,
      borderStyle: 'thin',
      bold: true,
      alignCenter: true,
    });
  }

  private writeHeader(sheet: ExcelJS.Worksheet, rowNumber: number, headers: string[]) {
    const row = sheet.getRow(rowNumber);
    row.values = headers;
    row.font = { bold: true };
    row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    for (let columnNumber = 1; columnNumber <= headers.length; columnNumber += 1) {
      const cell = row.getCell(columnNumber);
      cell.fill = patternFill(COLOR_WHITE);
      cell.border = blackBorder('thin');
    }
  }

  private styleSalesContractHeader(sheet: ExcelJS.Worksheet) {
    for (let columnNumber = 18; columnNumber <= 24; columnNumber += 1) {
      sheet.getCell(3, columnNumber).fill = patternFill(COLOR_CONTRACT_HEADER);
    }
    const noteCell = sheet.getCell(3, 25);
    noteCell.font = { color: { argb: COLOR_BLUE } };
    noteCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }

  private styleSectionTitle(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number) {
    this.styleRange(sheet, rowNumber, 1, rowNumber, columnCount, {
      fill: COLOR_TITLE,
      borderStyle: 'thin',
      bold: true,
    });
  }

  private styleDataArea(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    columnCount: number,
    amountColumns: number[],
    wrapColumns: number[],
  ) {
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      row.height = 22;
      for (let columnNumber = 1; columnNumber <= columnCount; columnNumber += 1) {
        const cell = row.getCell(columnNumber);
        cell.border = blackBorder('thin');
        cell.alignment = {
          vertical: 'middle',
          horizontal: amountColumns.includes(columnNumber) ? 'right' : 'left',
          wrapText: wrapColumns.includes(columnNumber),
        };
        if (amountColumns.includes(columnNumber)) cell.numFmt = MONEY_FORMAT;
      }
    }
  }

  private styleTotalRow(
    row: ExcelJS.Row,
    columnCount: number,
    amountColumns: number[],
  ) {
    row.font = { bold: true };
    for (let columnNumber = 1; columnNumber <= columnCount; columnNumber += 1) {
      const cell = row.getCell(columnNumber);
      cell.border = blackBorder('medium');
      if (amountColumns.includes(columnNumber)) cell.numFmt = MONEY_FORMAT;
    }
  }

  private styleRange(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    startColumn: number,
    endRow: number,
    endColumn: number,
    options: {
      fill?: string;
      borderStyle?: ExcelJS.BorderStyle;
      bold?: boolean;
      alignCenter?: boolean;
    },
  ) {
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      for (let columnNumber = startColumn; columnNumber <= endColumn; columnNumber += 1) {
        const cell = sheet.getCell(rowNumber, columnNumber);
        if (options.fill) cell.fill = patternFill(options.fill);
        if (options.borderStyle) cell.border = blackBorder(options.borderStyle);
        if (options.bold) cell.font = { ...cell.font, bold: true };
        if (options.alignCenter) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        }
      }
    }
  }

  private fillRow(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number, color: string) {
    for (let columnNumber = 1; columnNumber <= columnCount; columnNumber += 1) {
      sheet.getCell(rowNumber, columnNumber).fill = patternFill(color);
    }
  }

  private fillCells(row: ExcelJS.Row, columnNumbers: number[], color: string) {
    for (const columnNumber of columnNumbers) {
      row.getCell(columnNumber).fill = patternFill(color);
    }
  }

  private applyLedgerSemanticColors(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    categoryColumn: number,
    statusColumn: number,
    kind: CategoryKind,
  ) {
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      const categoryCell = sheet.getCell(rowNumber, categoryColumn);
      const categoryColor = ledgerCategoryColor(cellText(categoryCell), kind);
      if (categoryColor) categoryCell.fill = patternFill(categoryColor);

      const statusCell = sheet.getCell(rowNumber, statusColumn);
      const statusColor = paymentStatusColor(cellText(statusCell));
      if (statusColor) statusCell.fill = patternFill(statusColor);
    }
  }

  private applyCategoryTableColors(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    kind: CategoryKind,
  ) {
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      const categoryCell = sheet.getCell(rowNumber, 4);
      const categoryColor = categoryTableColor(cellText(categoryCell), kind);
      if (categoryColor) categoryCell.fill = patternFill(categoryColor);
    }
  }

  private applySummaryGroupBorders(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
    const mediumLeftColumns = [1, 2, 5, 8, 11, 12, 13];
    const mediumRightColumns = [1, 4, 7, 10, 11, 12, 13];
    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
      for (const columnNumber of mediumLeftColumns) {
        const cell = sheet.getCell(rowNumber, columnNumber);
        cell.border = { ...cell.border, left: borderSide('medium') };
      }
      for (const columnNumber of mediumRightColumns) {
        const cell = sheet.getCell(rowNumber, columnNumber);
        cell.border = { ...cell.border, right: borderSide('medium') };
      }
    }
  }
}

type QuarterSummaryRow = {
  label: string;
  sales: TaxInvoiceSummary;
  purchases: TaxInvoiceSummary;
};

function buildQuarterRows(
  salesRows: ConvertedTaxInvoiceRow[],
  purchaseRows: ConvertedTaxInvoiceRow[],
): QuarterSummaryRow[] {
  const q1 = buildQuarterSummary('1분기', salesRows, purchaseRows);
  const q2 = buildQuarterSummary('2분기', salesRows, purchaseRows);
  const q3 = buildQuarterSummary('3분기', salesRows, purchaseRows);
  const q4 = buildQuarterSummary('4분기', salesRows, purchaseRows);
  return [
    q1,
    q2,
    mergeQuarterSummary('1기확정', q1, q2),
    q3,
    q4,
    mergeQuarterSummary('2기확정', q3, q4),
    mergeQuarterSummary('년계', mergeQuarterSummary('', q1, q2), mergeQuarterSummary('', q3, q4)),
  ];
}

function buildQuarterSummary(
  quarter: string,
  salesRows: ConvertedTaxInvoiceRow[],
  purchaseRows: ConvertedTaxInvoiceRow[],
): QuarterSummaryRow {
  return {
    label: quarter,
    sales: summarizeConvertedRows(salesRows.filter((row) => row.quarter === quarter)),
    purchases: summarizeConvertedRows(purchaseRows.filter((row) => row.quarter === quarter)),
  };
}

function mergeQuarterSummary(
  label: string,
  left: QuarterSummaryRow,
  right: QuarterSummaryRow,
): QuarterSummaryRow {
  return {
    label,
    sales: addSummary(left.sales, right.sales),
    purchases: addSummary(left.purchases, right.purchases),
  };
}

function summarizeConvertedRows(rows: ConvertedTaxInvoiceRow[]): TaxInvoiceSummary {
  return {
    count: rows.length,
    supplyAmount: sum(rows, 'supplyAmount'),
    taxAmount: sum(rows, 'taxAmount'),
    totalAmount: sum(rows, 'totalAmount'),
  };
}

function addSummary(left: TaxInvoiceSummary, right: TaxInvoiceSummary): TaxInvoiceSummary {
  return {
    count: left.count + right.count,
    supplyAmount: left.supplyAmount + right.supplyAmount,
    taxAmount: left.taxAmount + right.taxAmount,
    totalAmount: left.totalAmount + right.totalAmount,
  };
}

function subtractSummary(left: TaxInvoiceSummary, right: TaxInvoiceSummary): TaxInvoiceSummary {
  return {
    count: left.count - right.count,
    supplyAmount: left.supplyAmount - right.supplyAmount,
    taxAmount: left.taxAmount - right.taxAmount,
    totalAmount: left.totalAmount - right.totalAmount,
  };
}

function formatShortDate(value: string) {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `'${match[1].slice(2)}-${match[2]}-${match[3]}`;
}

function sortConvertedRows(rows: ConvertedTaxInvoiceRow[]) {
  return [...rows].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) return byDate;
    return left.sourceRowNumber - right.sourceRowNumber;
  });
}

function displayCategory(category: string) {
  return category === '미분류' ? '' : category;
}

function normalizedCategory(category: string) {
  return category && category !== '미분류' ? category : '미분류';
}

function ledgerCategoryColor(category: string, kind: CategoryKind) {
  if (!category) return undefined;
  return kind === 'sales'
    ? SALES_CATEGORY_COLORS[category]
    : PURCHASE_LEDGER_CATEGORY_COLORS[category];
}

function categoryTableColor(category: string, kind: CategoryKind) {
  if (!category) return undefined;
  return kind === 'sales' ? SALES_CATEGORY_COLORS[category] : PURCHASE_CATEGORY_COLORS[category];
}

function paymentStatusColor(status: string) {
  return status === '외상' ? COLOR_RED : undefined;
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text ?? '').trim();
    if ('result' in value) return String(value.result ?? '').trim();
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text).join('').trim();
    }
  }
  return String(value).trim();
}

function mergeCategories(baseCategories: string[], rows: ConvertedTaxInvoiceRow[]) {
  const merged = [...baseCategories];
  for (const row of rows) {
    const category = normalizedCategory(row.category);
    if (!merged.includes(category)) merged.push(category);
  }
  return merged;
}

function categoryMemo(category: string) {
  if (category === '자재') return '공사관련경비일체';
  if (category === '외주비') return '매입장에는 외주비, 회계입력 계정과목은 외주공사비';
  if (category === '건설기계' || category === '중기대') return '건설기계등록증 有';
  return '';
}

function sum(rows: ConvertedTaxInvoiceRow[], key: keyof ConvertedTaxInvoiceRow) {
  return rows.reduce((total, row) => {
    const value = row[key];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

function sumNullable(rows: ConvertedTaxInvoiceRow[], key: keyof ConvertedTaxInvoiceRow) {
  return rows.reduce((total, row) => {
    const value = row[key];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

function patternFill(argb: string): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  };
}

function blackBorder(style: ExcelJS.BorderStyle): Partial<ExcelJS.Borders> {
  return {
    top: borderSide(style),
    left: borderSide(style),
    bottom: borderSide(style),
    right: borderSide(style),
  };
}

function borderSide(style: ExcelJS.BorderStyle): Partial<ExcelJS.Border> {
  return { style, color: { argb: COLOR_BLACK } };
}
