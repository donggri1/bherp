import { AppShell } from "@/components/layout/AppShell";
import { AdminSettingsManager } from "@/features/operation/admin-settings/components/AdminSettingsManager";

export default function AdminSettingsPage() {
  return (
    <AppShell>
      <AdminSettingsManager />
    </AppShell>
  );
}
