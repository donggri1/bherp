import { AppShell } from "@/components/layout/AppShell";
import { UsersManager } from "@/features/operation/users/components/UsersManager";

export default function UsersPage() {
  return (
    <AppShell>
      <UsersManager />
    </AppShell>
  );
}
