import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-auto bg-muted/10 p-5 md:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
