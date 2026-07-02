import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type {
  AdminSettings,
  CertificateExpiryAlert,
  CertificateExpiryAlertRule,
} from "../types/admin-settings.types";

const SETTINGS_PATH = "/app-settings";
const NOTIFICATIONS_PATH = "/notifications/certificate-expiry";

function authToken() {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("로그인이 필요합니다.");
  return accessToken;
}

export function getAdminSettings() {
  return apiClient<AdminSettings>(SETTINGS_PATH, {
    accessToken: authToken(),
  });
}

export function updateAdminSettings(certificateExpiryAlertRules: CertificateExpiryAlertRule[]) {
  return apiClient<AdminSettings>(SETTINGS_PATH, {
    method: "PUT",
    accessToken: authToken(),
    body: JSON.stringify({ certificateExpiryAlertRules }),
  });
}

export function getCertificateExpiryAlerts() {
  return apiClient<CertificateExpiryAlert[]>(NOTIFICATIONS_PATH, {
    accessToken: authToken(),
  });
}
