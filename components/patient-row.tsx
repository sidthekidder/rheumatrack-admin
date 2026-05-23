'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { complianceTextColor } from '@/lib/compliance';

export type PatientRowData = {
  id: string;
  name: string | null;
  diagnosis: string | null;
  created_at: string | null;
  compliance_pct: number | null;
  log_count: number;
};

export function PatientRow({ patient }: { patient: PatientRowData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push(`/patients/${patient.id}`);
    });
  }

  return (
    <TableRow
      onClick={handleClick}
      data-pending={isPending ? '' : undefined}
      className="cursor-pointer hover:bg-muted/50 data-[pending]:opacity-50"
    >
      <TableCell className="font-medium">{patient.name ?? '—'}</TableCell>
      <TableCell>{patient.diagnosis ?? '—'}</TableCell>
      <TableCell>
        {patient.compliance_pct === null ? (
          <span className="text-muted-foreground">no activity</span>
        ) : (
          <span className={`font-medium ${complianceTextColor(patient.compliance_pct)}`}>
            {patient.compliance_pct}%
            <span className="ml-1 text-xs text-muted-foreground">
              ({patient.log_count})
            </span>
          </span>
        )}
      </TableCell>
      <TableCell>
        {patient.created_at ? format(new Date(patient.created_at), 'PP') : '—'}
      </TableCell>
    </TableRow>
  );
}
