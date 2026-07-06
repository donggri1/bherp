export type TaxInvoiceSummary = {
  count: number;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type TaxInvoicePreviewSummary = TaxInvoiceSummary & {
  headerSummary: TaxInvoiceSummary;
  matchesHeader: boolean;
};

export type TaxInvoicePreviewRow = {
  kind: "sales" | "purchase";
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
  sales: TaxInvoicePreviewSummary;
  purchases: TaxInvoicePreviewSummary;
  warnings: string[];
  rows: {
    sales: TaxInvoicePreviewRow[];
    purchases: TaxInvoicePreviewRow[];
  };
};

export type TaxInvoiceConversionRequest = {
  year: number;
  month: number;
  salesFile: File;
  purchaseFile: File;
};
