import { AppShell } from "@/components/layout/AppShell";
import { PositionsManager } from "@/features/operation/positions/components/PositionsManager";

export default function PositionsPage() {
  return (
    <AppShell>
      <PositionsManager />
    </AppShell>
  );
}
