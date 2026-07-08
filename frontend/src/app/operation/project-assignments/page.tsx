import { AppShell } from "@/components/layout/AppShell";
import { ProjectAssignmentsManager } from "@/features/operation/project-assignments/components/ProjectAssignmentsManager";

export default function ProjectAssignmentsPage() {
  return (
    <AppShell>
      <ProjectAssignmentsManager />
    </AppShell>
  );
}
