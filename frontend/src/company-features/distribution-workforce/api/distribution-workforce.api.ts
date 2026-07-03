import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ApiList } from "@/types/api";
import type {
  DistributionWorkforceEmployee,
  DistributionWorkforceQuery,
  FetchAndUpsertResult,
  RegisterBaseCertificateResult,
} from "../types/distribution-workforce.types";

const PATH = "/distribution-workforce";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

export function getDistributionWorkforceEmployees(query: DistributionWorkforceQuery = {}) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.departmentName) params.set("departmentName", query.departmentName);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
  if (query.hasBaseCertificate !== undefined) {
    params.set("hasBaseCertificate", String(query.hasBaseCertificate));
  }
  if (query.hasBaseCertificateNo !== undefined) {
    params.set("hasBaseCertificateNo", String(query.hasBaseCertificateNo));
  }

  return apiClient<ApiList<DistributionWorkforceEmployee>>(
    `${PATH}/employees?${params.toString()}`,
    { accessToken: authToken() },
  );
}

export function registerDistributionBaseCertificate(employeeIds: number[]) {
  return apiClient<RegisterBaseCertificateResult>(`${PATH}/register-base-certificate`, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify({ employeeIds }),
  });
}

export function fetchAndUpsertDistributionWorkforce(
  employeeIds: number[],
  periodFrom: string,
  periodTo: string,
) {
  return apiClient<FetchAndUpsertResult>(`${PATH}/fetch-and-upsert`, {
    method: "POST",
    accessToken: authToken(),
    body: JSON.stringify({ employeeIds, periodFrom, periodTo }),
  });
}
