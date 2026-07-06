import { getAccessToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type {
  TaxInvoiceConversionRequest,
  TaxInvoicePreview,
} from "../types/sungwon-tax-invoice-converter.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const PATH = "/sungwon-tax-invoice-converter";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

function buildFormData(request: TaxInvoiceConversionRequest) {
  const formData = new FormData();
  formData.append("year", String(request.year));
  formData.append("month", String(request.month));
  formData.append("salesFile", request.salesFile);
  formData.append("purchaseFile", request.purchaseFile);
  return formData;
}

export async function previewSungwonTaxInvoice(request: TaxInvoiceConversionRequest) {
  const response = await fetch(`${API_BASE_URL}${PATH}/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken()}`,
    },
    body: buildFormData(request),
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<TaxInvoicePreview> | null;

  if (response.status === 401) throw new Error("인증이 만료되었습니다.");
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "미리보기에 실패했습니다.");
  }

  return payload.data;
}

export async function downloadSungwonTaxInvoice(request: TaxInvoiceConversionRequest) {
  const response = await fetch(`${API_BASE_URL}${PATH}/convert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken()}`,
    },
    body: buildFormData(request),
  });

  if (response.status === 401) throw new Error("인증이 만료되었습니다.");
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new Error(payload?.message ?? "변환 파일 생성에 실패했습니다.");
  }

  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get("content-disposition")),
  };
}

function parseFileName(contentDisposition: string | null) {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return "세금계산서-성원전기.xlsx";
}
