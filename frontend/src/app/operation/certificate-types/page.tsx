import { AppShell } from "@/components/layout/AppShell";
import { CertificateTypesManager } from "@/features/operation/certificate-types/components/CertificateTypesManager";

export default function CertificateTypesPage() {
  return (
    <AppShell>
      <CertificateTypesManager />
    </AppShell>
  );
}
