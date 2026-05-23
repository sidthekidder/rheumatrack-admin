'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PatientRow, type PatientRowData } from '@/components/patient-row';

export function PatientsList({ patients }: { patients: PatientRowData[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.diagnosis?.toLowerCase().includes(q),
    );
  }, [patients, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name or diagnosis…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {patients.length}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Compliance</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <td colSpan={4} className="p-4 text-sm text-muted-foreground">
                No patients match &ldquo;{query}&rdquo;.
              </td>
            </TableRow>
          ) : (
            filtered.map((p) => <PatientRow key={p.id} patient={p} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
