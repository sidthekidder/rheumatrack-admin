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
import { complianceBucket } from '@/lib/compliance';
import { cn } from '@/lib/utils';

type Bucket = 'all' | 'high' | 'medium' | 'low' | 'none';

const BUCKETS: { key: Bucket; label: string; activeClass: string }[] = [
  { key: 'all', label: 'All', activeClass: 'bg-foreground text-background' },
  {
    key: 'high',
    label: 'On track',
    activeClass:
      'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white',
  },
  {
    key: 'medium',
    label: 'Watch',
    activeClass: 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white',
  },
  {
    key: 'low',
    label: 'At risk',
    activeClass: 'bg-rose-500 text-white dark:bg-rose-600 dark:text-white',
  },
  {
    key: 'none',
    label: 'No activity',
    activeClass: 'bg-muted-foreground text-background',
  },
];

function bucketOf(pct: number | null): Bucket {
  if (pct === null) return 'none';
  return complianceBucket(pct);
}

export function PatientsList({ patients }: { patients: PatientRowData[] }) {
  const [query, setQuery] = useState('');
  const [bucket, setBucket] = useState<Bucket>('all');

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = {
      all: patients.length,
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };
    for (const p of patients) c[bucketOf(p.compliance_pct)] += 1;
    return c;
  }, [patients]);

  const filtered = useMemo(() => {
    let result = patients;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.diagnosis?.toLowerCase().includes(q),
      );
    }

    if (bucket !== 'all') {
      result = result.filter((p) => bucketOf(p.compliance_pct) === bucket);
    }

    return result;
  }, [patients, query, bucket]);

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

      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((b) => {
          const isActive = bucket === b.key;
          const disabled = counts[b.key] === 0 && b.key !== 'all';
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setBucket(b.key)}
              disabled={disabled}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? b.activeClass
                  : 'border-border bg-background text-foreground hover:bg-muted',
                disabled && 'opacity-40',
              )}
            >
              {b.label} ({counts[b.key]})
            </button>
          );
        })}
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
                No patients match the current filters.
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
