import { AppShell } from "@/components/layout/AppShell";
import { DepartmentsManager } from "@/features/operation/departments/components/DepartmentsManager";

export default function DepartmentsPage() {
  return (
    <AppShell>
      <DepartmentsManager />
    </AppShell>
  );
}
