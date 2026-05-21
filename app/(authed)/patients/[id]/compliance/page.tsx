import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { ComplianceChart } from '@/components/compliance-chart';
import { format, subDays } from 'date-fns';

const WINDOW_DAYS = 30;

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const since = subDays(new Date(), WINDOW_DAYS).toISOString().slice(0, 10);
  const [{ data: logs }] = await Promise.all([
    supabase
      .from('medication_log')
      .select('log_date, taken')
      .eq('patient_id', id)
      .gte('log_date', since)
      .order('log_date', { ascending: true }),
    logAdminAccess('view_compliance', id, { window_days: WINDOW_DAYS }),
  ]);

  // Roll up per-day compliance %.
  const byDay = new Map<string, { taken: number; total: number }>();
  for (const row of logs ?? []) {
    const cur = byDay.get(row.log_date) ?? { taken: 0, total: 0 };
    cur.total += 1;
    if (row.taken) cur.taken += 1;
    byDay.set(row.log_date, cur);
  }
  const series = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: format(new Date(date), 'MMM d'),
      pct: v.total === 0 ? 0 : Math.round((v.taken / v.total) * 100),
    }));

  const totals = (logs ?? []).reduce(
    (acc, r) => ({ taken: acc.taken + (r.taken ? 1 : 0), total: acc.total + 1 }),
    { taken: 0, total: 0 },
  );
  const overall = totals.total === 0 ? 0 : Math.round((totals.taken / totals.total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Daily adherence over the last {WINDOW_DAYS} days.
          </p>
        </div>
        <Link href={`/patients/${id}`} className={buttonVariants({ variant: 'outline' })}>
          Back to patient
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall: {overall}%</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">No log entries in this window.</p>
          ) : (
            <ComplianceChart data={series} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
