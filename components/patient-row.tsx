'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export type PatientRowData = {
  id: string;
  name: string | null;
  diagnosis: string | null;
  created_at: string | null;
  updated_at: string | null;
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
        {patient.created_at ? format(new Date(patient.created_at), 'PP') : '—'}
      </TableCell>
      <TableCell>
        {patient.updated_at ? format(new Date(patient.updated_at), 'PP') : '—'}
      </TableCell>
    </TableRow>
  );
}
