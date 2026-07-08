import { AppShell } from "@/components/layout/AppShell";
import { ProjectsManager } from "@/features/operation/projects/components/ProjectsManager";

export default function ProjectsPage() {
  return (
    <AppShell>
      <ProjectsManager />
    </AppShell>
  );
}
