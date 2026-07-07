import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { HrDashboard } from "../types/hr-dashboard.types";

const PATH = "/hr-dashboard";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

export function getHrDashboard(query: { expiryDays?: number } = {}) {
  const params = new URLSearchParams();
  if (query.expiryDays) params.set("expiryDays", String(query.expiryDays));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiClient<HrDashboard>(`${PATH}${suffix}`, {
    accessToken: authToken(),
  });
}
