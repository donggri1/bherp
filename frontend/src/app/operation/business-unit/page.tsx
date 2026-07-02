import { AppShell } from "@/components/layout/AppShell";
import { BusinessUnitManager } from "@/features/operation/business-unit/components/BusinessUnitManager";

export default function BusinessUnitPage() {
  return (
    <AppShell>
      <BusinessUnitManager />
    </AppShell>
  );
}
