"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearTokens } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

export function AppHeader() {
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <div className="text-base font-semibold">ERP System</div>
      <div className="flex items-center gap-4 text-sm">
        <span className="hidden text-muted-foreground sm:inline">BHERP</span>
        <NotificationBell />
        <span className="inline-flex items-center gap-2 font-medium">
          <UserRound className="size-4" aria-hidden />
          관리자
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" aria-hidden />
          로그아웃
        </Button>
      </div>
    </header>
  );
}
