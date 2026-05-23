import { subDays, format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientsList } from '@/components/patients-list';

const COMPLIANCE_WINDOW_DAYS = 30;

export default async function PatientsPage() {
  const supabase = await createClient();
  const since = format(subDays(new Date(), COMPLIANCE_WINDOW_DAYS), 'yyyy-MM-dd');

  const [{ data: patients, error }, { data: logs }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, name, diagnosis, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('medication_log')
      .select('patient_id, taken')
      .gte('log_date', since),
    logAdminAccess('list_patients'),
  ]);

  const byPatient = new Map<string, { taken: number; total: number }>();
  for (const row of logs ?? []) {
    const cur = byPatient.get(row.patient_id) ?? { taken: 0, total: 0 };
    cur.total += 1;
    if (row.taken) cur.taken += 1;
    byPatient.set(row.patient_id, cur);
  }

  const enriched = (patients ?? []).map((p) => {
    const r = byPatient.get(p.id);
    return {
      id: p.id,
      name: p.name,
      diagnosis: p.diagnosis,
      created_at: p.created_at,
      compliance_pct:
        !r || r.total === 0 ? null : Math.round((r.taken / r.total) * 100),
      log_count: r?.total ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Compliance shown over the last {COMPLIANCE_WINDOW_DAYS} days. Click a row to drill in.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {enriched.length} patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <PatientsList patients={enriched} />
        </CardContent>
      </Card>
    </div>
  );
}
