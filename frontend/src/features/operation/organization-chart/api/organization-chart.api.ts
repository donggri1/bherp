import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type {
  OrganizationChart,
  OrganizationChartDepartmentEmployees,
} from "../types/organization-chart.types";

const PATH = "/organization-chart";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

export function getOrganizationChart() {
  return apiClient<OrganizationChart>(PATH, {
    accessToken: authToken(),
  });
}

export function getOrganizationChartDepartmentEmployees(
  departmentId: number,
  query: { page?: number; limit?: number } = {},
) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 100));

  return apiClient<OrganizationChartDepartmentEmployees>(
    `${PATH}/departments/${departmentId}/employees?${params.toString()}`,
    {
      accessToken: authToken(),
    },
  );
}
