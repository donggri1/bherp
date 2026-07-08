import { AppShell } from "@/components/layout/AppShell";
import { ProjectSitesManager } from "@/features/operation/project-sites/components/ProjectSitesManager";

export default function ProjectSitesPage() {
  return (
    <AppShell>
      <ProjectSitesManager />
    </AppShell>
  );
}
