import { AppShell } from "@/components/layout/AppShell";
import { BusinessRegistrationManager } from "@/features/operation/business-registration/components/BusinessRegistrationManager";

export default function BusinessRegistrationPage() {
  return (
    <AppShell>
      <BusinessRegistrationManager />
    </AppShell>
  );
}
