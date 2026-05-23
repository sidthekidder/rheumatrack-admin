import { subDays, format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { complianceTextColor } from '@/lib/compliance';

const WINDOW_DAYS = 30;
const ACTIVITY_DAYS = 7;
const HIGH_COMPLIANCE_THRESHOLD = 80;

export default async function DashboardPage() {
  const supabase = await createClient();

  const since30 = format(subDays(new Date(), WINDOW_DAYS), 'yyyy-MM-dd');
  const since7 = format(subDays(new Date(), ACTIVITY_DAYS), 'yyyy-MM-dd');

  const [{ count: totalPatients }, { data: logs30 }, { count: editsCount }] =
    await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase
        .from('medication_log')
        .select('patient_id, log_date, taken')
        .gte('log_date', since30),
      supabase
        .from('medication_log_history')
        .select('*', { count: 'exact', head: true })
        .gte('edited_at', new Date(since7).toISOString()),
      logAdminAccess('view_dashboard'),
    ]);

  const logs = logs30 ?? [];

  // Per-patient rollup over the 30-day window.
  const byPatient = new Map<string, { taken: number; total: number }>();
  for (const row of logs) {
    const cur = byPatient.get(row.patient_id) ?? { taken: 0, total: 0 };
    cur.total += 1;
    if (row.taken) cur.taken += 1;
    byPatient.set(row.patient_id, cur);
  }

  const pcts = Array.from(byPatient.values()).map((v) =>
    v.total === 0 ? 0 : (v.taken / v.total) * 100,
  );
  const inCompliance = pcts.filter((p) => p >= HIGH_COMPLIANCE_THRESHOLD).length;
  const avgCompliance =
    pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

  const activeLast7 = new Set(
    logs.filter((l) => l.log_date >= since7).map((l) => l.patient_id),
  ).size;
  const logsLast7 = logs.filter((l) => l.log_date >= since7).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Last {WINDOW_DAYS} days unless noted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Total patients" value={totalPatients ?? 0} />
        <Metric
          label={`Active (last ${ACTIVITY_DAYS}d)`}
          value={activeLast7}
          sub={
            totalPatients
              ? `${Math.round((activeLast7 / totalPatients) * 100)}% of total`
              : undefined
          }
        />
        <Metric
          label="Avg compliance"
          value={`${avgCompliance}%`}
          valueClass={complianceTextColor(avgCompliance)}
          sub={`across ${pcts.length} patients with activity`}
        />
        <Metric
          label={`≥${HIGH_COMPLIANCE_THRESHOLD}% adherence`}
          value={`${inCompliance} of ${pcts.length || 0}`}
          sub={
            pcts.length
              ? `${Math.round((inCompliance / pcts.length) * 100)}% on track`
              : 'no activity yet'
          }
        />
        <Metric label={`Logs (last ${ACTIVITY_DAYS}d)`} value={logsLast7} />
        <Metric
          label={`Edits (last ${ACTIVITY_DAYS}d)`}
          value={editsCount ?? 0}
          sub="patient corrections"
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${valueClass ?? ''}`}>{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
