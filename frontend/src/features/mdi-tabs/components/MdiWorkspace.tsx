type MdiWorkspaceProps = {
  children: React.ReactNode;
};

export function MdiWorkspace({ children }: MdiWorkspaceProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-muted/10 p-5 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">{children}</div>
    </div>
  );
}
