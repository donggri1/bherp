"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCertificateExpiryAlerts } from "@/features/operation/admin-settings/api/admin-settings.api";
import type { CertificateExpiryAlert } from "@/features/operation/admin-settings/types/admin-settings.types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CertificateExpiryAlert[]>([]);

  const loadItems = async () => {
    try {
      const result = await getCertificateExpiryAlerts();
      setItems(result);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        aria-label="알림"
      >
        <Bell className="size-4" aria-hidden />
        {items.length ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {items.length > 9 ? "9+" : items.length}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-[360px] rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-semibold">알림</div>
            <Link
              href="/operation/employee-certificate-inquiry"
              className="text-xs font-medium text-primary"
              onClick={() => setOpen(false)}
            >
              조회화면
            </Link>
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length ? items.map((item) => (
              <div key={item.id} className="border-b px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {item.employeeName} · {item.certificateTypeName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.employeeCode} / {item.departmentName ?? "-"} / {item.positionName ?? "-"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      만료일 {item.expiredDate}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {item.alertRuleLabel}
                  </span>
                </div>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                확인할 알림이 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
