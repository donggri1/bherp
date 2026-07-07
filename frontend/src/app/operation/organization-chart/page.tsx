import { AppShell } from "@/components/layout/AppShell";
import { OrganizationChartManager } from "@/features/operation/organization-chart/components/OrganizationChartManager";

export default function OrganizationChartPage() {
  return (
    <AppShell>
      <OrganizationChartManager />
    </AppShell>
  );
}
