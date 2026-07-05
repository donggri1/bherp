"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { menuGroups } from "@/config/menus";
import { MdiTabBar } from "@/features/mdi-tabs/components/MdiTabBar";
import { MdiWorkspace } from "@/features/mdi-tabs/components/MdiWorkspace";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MenuGroup } from "./MenuGroup";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/10">
          <MdiTabBar />
          <MdiWorkspace>{children}</MdiWorkspace>
        </main>
      </div>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="메뉴 닫기"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold"
              >
                Dashboard
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="메뉴 닫기"
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-auto">
              {menuGroups.map((group) => (
                <MenuGroup
                  key={group.menuGroupCode}
                  group={group}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
