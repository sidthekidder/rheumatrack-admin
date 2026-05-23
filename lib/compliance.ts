export type LogRow = {
  log_date: string;
  taken: boolean | null;
};

export type ComplianceSummary = {
  taken: number;
  missed: number;
  total: number;
  pct: number; // 0-100, rounded
};

export function rollupCompliance(logs: LogRow[]): ComplianceSummary {
  const total = logs.length;
  const taken = logs.filter((l) => l.taken === true).length;
  const missed = total - taken;
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  return { taken, missed, total, pct };
}

// Per-day rollup for the line chart.
export function dailyComplianceSeries(
  logs: LogRow[],
): { date: string; pct: number; total: number }[] {
  const byDay = new Map<string, { taken: number; total: number }>();
  for (const row of logs) {
    const cur = byDay.get(row.log_date) ?? { taken: 0, total: 0 };
    cur.total += 1;
    if (row.taken) cur.taken += 1;
    byDay.set(row.log_date, cur);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      pct: v.total === 0 ? 0 : Math.round((v.taken / v.total) * 100),
      total: v.total,
    }));
}

// Color/label helpers — 80% high, 50–80% medium, <50% low.
export function complianceBucket(pct: number): 'high' | 'medium' | 'low' {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}

export function complianceTextColor(pct: number): string {
  const b = complianceBucket(pct);
  if (b === 'high') return 'text-emerald-600 dark:text-emerald-400';
  if (b === 'medium') return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function complianceBgColor(pct: number): string {
  const b = complianceBucket(pct);
  if (b === 'high') return 'bg-emerald-500';
  if (b === 'medium') return 'bg-amber-500';
  return 'bg-rose-500';
}

export function complianceLabel(pct: number): string {
  const b = complianceBucket(pct);
  if (b === 'high') return 'On track';
  if (b === 'medium') return 'Watch';
  return 'At risk';
}
