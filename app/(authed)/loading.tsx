import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-background/80 px-6 py-5 shadow-sm">
        <Loader2 className="size-7 animate-spin text-foreground/70" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
