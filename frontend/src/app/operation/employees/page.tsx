import { AppShell } from "@/components/layout/AppShell";
import { EmployeesManager } from "@/features/operation/employees/components/EmployeesManager";

export default function EmployeesPage() {
  return (
    <AppShell>
      <EmployeesManager />
    </AppShell>
  );
}
