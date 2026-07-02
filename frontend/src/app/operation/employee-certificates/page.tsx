import { AppShell } from "@/components/layout/AppShell";
import { EmployeeCertificatesManager } from "@/features/operation/employee-certificates/components/EmployeeCertificatesManager";

export default function EmployeeCertificatesPage() {
  return (
    <AppShell>
      <EmployeeCertificatesManager />
    </AppShell>
  );
}
