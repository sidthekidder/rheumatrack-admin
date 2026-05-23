'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Plus, Save } from 'lucide-react';
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
import { VasBar } from '@/components/vas-bar';

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
              Record what the patient reports. Mirrors the in-app diary form.
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

            <VasBar
              label="Pain"
              value={pain}
              max={10}
              onChange={setPain}
              color="bg-red-500"
            />
            <VasBar
              label="Morning stiffness"
              value={stiffness}
              max={120}
              unit="min"
              step={5}
              onChange={setStiffness}
              color="bg-amber-500"
            />
            <VasBar
              label="Fatigue"
              value={fatigue}
              max={10}
              onChange={setFatigue}
              color="bg-blue-500"
            />

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label className="text-xs font-bold uppercase tracking-wide">
                  Joints affected
                </Label>
                <span className="text-xs text-muted-foreground">
                  {joints.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {JOINTS.map((j) => {
                  const active = joints.includes(j);
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleJoint(j)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold',
                        active
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      {j}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-xs font-bold uppercase tracking-wide"
              >
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are they feeling?"
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
            <Button
              onClick={submit}
              disabled={isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="size-4" />
              {isPending ? 'Saving…' : 'Save entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
