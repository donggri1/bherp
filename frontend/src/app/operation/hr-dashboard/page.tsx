import { AppShell } from "@/components/layout/AppShell";
import { HrDashboardManager } from "@/features/operation/hr-dashboard/components/HrDashboardManager";

export default function HrDashboardPage() {
  return (
    <AppShell>
      <HrDashboardManager />
    </AppShell>
  );
}
