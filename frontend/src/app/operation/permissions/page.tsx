import { AppShell } from "@/components/layout/AppShell";
import { PermissionsManager } from "@/features/operation/permissions/components/PermissionsManager";

export default function PermissionsPage() {
  return (
    <AppShell>
      <PermissionsManager />
    </AppShell>
  );
}
