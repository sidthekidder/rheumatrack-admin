import { createClient } from '@/lib/supabase/server';
import { logAdminAccess } from '@/lib/audit';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientRow } from '@/components/patient-row';

export default async function PatientsPage() {
  const supabase = await createClient();
  const [{ data: patients, error }] = await Promise.all([
    supabase
      .from('patients')
      .select('id, name, diagnosis, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200),
    logAdminAccess('list_patients'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Patients</h1>
        <p className="text-sm text-muted-foreground">
          All patients registered on RheumaTrack. Click a row to drill in.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {patients?.length ?? 0} patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients?.map((p) => (
                <PatientRow key={p.id} patient={p} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
