import { AppShell } from "@/components/layout/AppShell";
import { EmployeeCertificateInquiryManager } from "@/features/operation/employee-certificates/components/EmployeeCertificateInquiryManager";

export default function EmployeeCertificateInquiryPage() {
  return (
    <AppShell>
      <EmployeeCertificateInquiryManager />
    </AppShell>
  );
}
