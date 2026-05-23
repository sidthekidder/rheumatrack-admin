import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ComplianceChart } from '@/components/compliance-chart';
import { DiaryEntryDialog } from '@/components/diary-entry-dialog';
import {
  rollupCompliance,
  dailyComplianceSeries,
  complianceTextColor,
  complianceBgColor,
  complianceLabel,
} from '@/lib/compliance';

const COMPLIANCE_WINDOW_DAYS = 30;

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const since = format(subDays(new Date(), COMPLIANCE_WINDOW_DAYS), 'yyyy-MM-dd');

  const [
    { data: patient },
    { data: meds },
    { data: complianceLogs },
    { data: recentLogs },
    { data: history },
  ] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('medicines')
      .select('id, drug_name, brand_name, dose, schedule_type, start_date')
      .eq('patient_id', id)
      .order('start_date', { ascending: false }),
    supabase
      .from('medication_log')
      .select('log_date, taken')
      .eq('patient_id', id)
      .gte('log_date', since)
      .order('log_date', { ascending: true }),
    supabase
      .from('medication_log')
      .select('id, medicine_id, log_date, slot, taken, created_at')
      .eq('patient_id', id)
      .order('log_date', { ascending: false })
      .limit(50),
    supabase
      .from('medication_log_history')
      .select('id, log_date, slot, prior_taken, new_taken, edited_at')
      .eq('patient_id', id)
      .order('edited_at', { ascending: false })
      .limit(50),
    logAdminAccess('view_patient', id),
  ]);

  if (!patient) notFound();

  const summary = rollupCompliance(complianceLogs ?? []);
  const series = dailyComplianceSeries(complianceLogs ?? []);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to overview
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{patient.name ?? 'Unnamed patient'}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.diagnosis ?? 'No diagnosis recorded'} · {patient.city ?? '—'},{' '}
            {patient.country ?? '—'}
          </p>
        </div>
        <DiaryEntryDialog
          patientId={id}
          patientName={patient.name ?? 'this patient'}
        />
      </div>

      {/* Compliance hero — big % + bar + chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Compliance (last {COMPLIANCE_WINDOW_DAYS} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No medication-log entries in this window.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className={`text-5xl font-semibold ${complianceTextColor(summary.pct)}`}>
                  {summary.pct}%
                </div>
                <div className="flex flex-col gap-1 pb-1 text-sm">
                  <Badge
                    variant="outline"
                    className={`${complianceTextColor(summary.pct)} w-fit`}
                  >
                    {complianceLabel(summary.pct)}
                  </Badge>
                  <span className="text-muted-foreground">
                    {summary.taken} taken · {summary.missed} missed of {summary.total}
                  </span>
                </div>
              </div>

              {/* Solid progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${complianceBgColor(summary.pct)}`}
                  style={{ width: `${summary.pct}%` }}
                />
              </div>

              {series.length > 1 && (
                <ComplianceChart
                  data={series.map((s) => ({
                    date: format(new Date(s.date), 'MMM d'),
                    pct: s.pct,
                  }))}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <div><span className="text-muted-foreground">Age:</span> {patient.age ?? '—'}</div>
          <div><span className="text-muted-foreground">Doctor:</span> {patient.doctor_name ?? '—'}</div>
          <div><span className="text-muted-foreground">Hospital:</span> {patient.doctor_hospital ?? '—'}</div>
          <div><span className="text-muted-foreground">Language:</span> {patient.language ?? '—'}</div>
          <div>
            <span className="text-muted-foreground">Joined:</span>{' '}
            {patient.created_at ? format(new Date(patient.created_at), 'PP') : '—'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medicines ({meds?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meds?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.drug_name}</TableCell>
                  <TableCell>{m.brand_name ?? '—'}</TableCell>
                  <TableCell>{m.dose ?? '—'}</TableCell>
                  <TableCell>{m.schedule_type ?? '—'}</TableCell>
                  <TableCell>
                    {m.start_date ? format(new Date(m.start_date), 'PP') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent log entries (last 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Taken</TableHead>
                <TableHead>Logged at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{format(new Date(l.log_date), 'PP')}</TableCell>
                  <TableCell>{l.slot}</TableCell>
                  <TableCell>{l.taken ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {l.created_at ? format(new Date(l.created_at), 'Pp') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Medication-log edits ({history?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Log date</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{format(new Date(h.edited_at), 'Pp')}</TableCell>
                    <TableCell>{format(new Date(h.log_date), 'PP')}</TableCell>
                    <TableCell>{h.slot}</TableCell>
                    <TableCell className="space-x-1">
                      <Badge variant="outline">
                        {h.prior_taken === null ? '∅' : h.prior_taken ? 'taken' : 'missed'}
                      </Badge>
                      <span>→</span>
                      <Badge>{h.new_taken ? 'taken' : 'missed'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No edits — this patient hasn&apos;t corrected any of their log entries.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
