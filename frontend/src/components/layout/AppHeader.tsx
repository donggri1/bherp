"use client";

import { LogOut, Menu, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { HeaderMenuSearch } from "@/features/menu-search/components/HeaderMenuSearch";
import { clearTokens } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

type AppHeaderProps = {
  onMenuClick?: () => void;
};

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 justify-self-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="truncate text-base font-semibold">ERP System</div>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-sm md:gap-3">
        <HeaderMenuSearch className="min-w-0 justify-end" />
        <span className="hidden text-muted-foreground sm:inline">BHERP</span>
        <NotificationBell />
        <span className="hidden items-center gap-2 font-medium sm:inline-flex">
          <UserRound className="size-4" aria-hidden />
          관리자
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
