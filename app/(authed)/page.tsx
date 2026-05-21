import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: patientCount }, { count: activeWeek }] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase
      .from('medication_log')
      .select('*', { count: 'exact', head: true })
      .gte('log_date', new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)),
    logAdminAccess('view_dashboard'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{patientCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Logs in last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeWeek ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base">All systems operational</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
