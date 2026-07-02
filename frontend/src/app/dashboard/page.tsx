import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader title="Dashboard" description="ERP 운영 현황을 확인합니다." />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["사업자", "0"],
          ["사업단위", "0"],
          ["사용자", "0"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
