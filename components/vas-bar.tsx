'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: number;
  min?: number;
  max: number;
  unit?: string;
  step?: number;
  onChange: (v: number) => void;
  // Tailwind background-color class for the fill, e.g. "bg-red-500".
  color: string;
};

/**
 * Web port of rheumatrack-app's VasBar. Tap (or drag) anywhere on the track
 * to snap the value to the nearest step. Visual matches the mobile component
 * — labeled track with a colored fill bar.
 */
export function VasBar({
  label,
  value,
  min = 0,
  max,
  unit = '',
  step = 1,
  onChange,
  color,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const fillPct = Math.max(0, Math.min(1, ratio)) * 100;

  function applyAtX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const r = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + r * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(snapped);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm font-semibold text-muted-foreground">
          {value}
          {unit ? ` ${unit}` : !unit && max <= 10 ? `/${max}` : ''}
        </span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          applyAtX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return; // only while held down
          applyAtX(e.clientX);
        }}
        className="relative h-6 cursor-pointer overflow-hidden rounded-full border bg-muted touch-none select-none"
      >
        <div
          className={cn('h-full rounded-full transition-[width]', color)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}
