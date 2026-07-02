"use client";

import { useMemo } from "react";

import { getAccessToken } from "@/lib/auth";

export function useAuth() {
  return useMemo(
    () => ({
      accessToken: getAccessToken(),
      isAuthenticated: Boolean(getAccessToken()),
    }),
    [],
  );
}
