export type NationalTaxInvoiceKind = 'sales' | 'purchase';

export type TaxInvoiceUploadFiles = {
  salesFile?: Express.Multer.File[];
  purchaseFile?: Express.Multer.File[];
};

export type TaxInvoiceSummary = {
  count: number;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type ParsedNationalTaxInvoice = {
  kind: NationalTaxInvoiceKind;
  fileName: string;
  title: string;
  headerSummary: TaxInvoiceSummary;
  rowSummary: TaxInvoiceSummary;
  rows: NationalTaxInvoiceRow[];
  warnings: string[];
};

export type NationalTaxInvoiceRow = {
  sourceRowNumber: number;
  issueDate: string;
  approvalNo: string;
  supplierBusinessNo: string;
  supplierName: string;
  supplierRepresentativeName: string;
  recipientBusinessNo: string;
  recipientName: string;
  recipientRepresentativeName: string;
  totalAmount: number;
  supplyAmount: number;
  taxAmount: number;
  invoiceClassification: string;
  invoiceType: string;
  issueType: string;
  note: string;
  receiptClaimType: string;
  itemDate: string;
  itemName: string;
  itemSupplyAmount: number;
  itemTaxAmount: number;
};

export type ConvertedTaxInvoiceRow = {
  kind: NationalTaxInvoiceKind;
  sourceRowNumber: number;
  quarter: string;
  sequence: number;
  date: string;
  category: string;
  constructionNo: string;
  partnerName: string;
  description: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceKind: string;
  paymentStatus: string;
  paymentDate: string;
  paidAmount: number | null;
  receivableAmount: number;
  memo: string;
  warnings: string[];
};

export type ConvertedTaxInvoiceData = {
  year: number;
  month: number;
  sales: ParsedNationalTaxInvoice;
  purchases: ParsedNationalTaxInvoice;
  salesRows: ConvertedTaxInvoiceRow[];
  purchaseRows: ConvertedTaxInvoiceRow[];
  warnings: string[];
};

export type TaxInvoicePreviewRow = {
  kind: NationalTaxInvoiceKind;
  rowNo: number;
  date: string;
  category: string;
  constructionNo?: string;
  partnerName: string;
  description: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  warningCount: number;
};

export type TaxInvoicePreview = {
  year: number;
  month: number;
  sales: TaxInvoiceSummary & {
    headerSummary: TaxInvoiceSummary;
    matchesHeader: boolean;
  };
  purchases: TaxInvoiceSummary & {
    headerSummary: TaxInvoiceSummary;
    matchesHeader: boolean;
  };
  warnings: string[];
  rows: {
    sales: TaxInvoicePreviewRow[];
    purchases: TaxInvoicePreviewRow[];
  };
};
