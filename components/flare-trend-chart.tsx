'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

export type FlareEntryRow = {
  entry_date: string; // YYYY-MM-DD
  pain: number;
  stiffness_min: number;
  fatigue: number;
};

// Same palette as rheumatrack-app/components/charts/FlareGraph.tsx.
const METRICS = [
  { key: 'pain', label: 'Pain', max: 10, color: '#EF4444' },
  { key: 'stiffness_min', label: 'Stiffness (min)', max: 120, color: '#F59E0B' },
  { key: 'fatigue', label: 'Fatigue', max: 10, color: '#3B82F6' },
] as const;

export function FlareTrendChart({ entries }: { entries: FlareEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No diary entries in this window.</p>
    );
  }

  const data = [...entries]
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((e) => ({
      ...e,
      label: format(new Date(e.entry_date), 'MMM d'),
    }));

  return (
    <div className="space-y-3">
      {METRICS.map((m) => {
        const gradId = `flareGrad_${m.key}`;
        return (
          <div key={m.key}>
            <div className="mb-1 text-xs font-semibold">{m.label}</div>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={m.color} stopOpacity={0.4} />
                      <stop offset="1" stopColor={m.color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={[0, m.max]} hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    labelFormatter={(l) => `Date: ${l}`}
                    formatter={(v) => [v as number, m.label]}
                  />
                  <Area
                    type="monotone"
                    dataKey={m.key}
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#${gradId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
