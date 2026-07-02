import { apiClient } from "@/lib/api";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export function login(payload: LoginRequest) {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
