'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { JOINTS } from '@/lib/joints';
import { createDiaryEntry } from '@/lib/actions';

const PAIN_FATIGUE_SCALE = Array.from({ length: 11 }, (_, i) => i); // 0..10
const STIFFNESS_PRESETS = [0, 15, 30, 60, 90, 120]; // minutes

export function DiaryEntryDialog({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [pain, setPain] = useState(0);
  const [stiffness, setStiffness] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [joints, setJoints] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setPain(0);
    setStiffness(0);
    setFatigue(0);
    setJoints([]);
    setNotes('');
    setError(null);
  }

  function toggleJoint(j: string) {
    setJoints((cur) => (cur.includes(j) ? cur.filter((x) => x !== j) : [...cur, j]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createDiaryEntry(patientId, {
        entry_date: entryDate,
        pain,
        stiffness_min: stiffness,
        fatigue,
        joints,
        notes,
      });
      if (result.ok) {
        reset();
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add diary entry
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Diary entry for {patientName}</DialogTitle>
          <DialogDescription>
            Record what the patient reports today. Saves immediately on Save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="entry_date">Date</Label>
            <Input
              id="entry_date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <ScaleField
            label="Pain"
            value={pain}
            onChange={setPain}
            options={PAIN_FATIGUE_SCALE}
            suffix="/10"
            colorClass="bg-rose-500 text-white border-rose-500"
          />

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Morning stiffness</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {stiffness} min
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STIFFNESS_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setStiffness(m)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    stiffness === m
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {m}m
                </button>
              ))}
              <Input
                type="number"
                min={0}
                max={600}
                step={5}
                value={stiffness}
                onChange={(e) => setStiffness(Number(e.target.value) || 0)}
                className="h-7 w-20"
              />
            </div>
          </div>

          <ScaleField
            label="Fatigue"
            value={fatigue}
            onChange={setFatigue}
            options={PAIN_FATIGUE_SCALE}
            suffix="/10"
            colorClass="bg-blue-500 text-white border-blue-500"
          />

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Affected joints</Label>
              <span className="text-xs text-muted-foreground">
                {joints.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {JOINTS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => toggleJoint(j)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    joints.includes(j)
                      ? 'bg-foreground border-foreground text-background'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else the patient mentioned…"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}

function ScaleField({
  label,
  value,
  onChange,
  options,
  suffix,
  colorClass,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  options: number[];
  suffix?: string;
  colorClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium text-muted-foreground">
          {value}
          {suffix ?? ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'h-8 w-8 rounded-md border text-sm font-medium',
              value === n ? colorClass : 'border-border bg-background hover:bg-muted',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
