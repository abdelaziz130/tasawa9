import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/** Counts down to `target` (ISO string). Falls back to end-of-day when omitted. */
export function CountdownTimer({ target }: { target?: string | null }) {
  const [end] = useState(() => {
    if (target) return new Date(target).getTime();
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ms = Math.max(0, end - now);
  if (ms <= 0) return null;

  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="rounded-2xl glass p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Timer className="size-5 text-accent" />
        <div className="text-xs">
          <div className="font-bold text-accent">ينتهي العرض بعد</div>
          <div className="text-[10px] text-muted-foreground">اطلب الآن قبل انتهاء الوقت</div>
        </div>
      </div>
      <div className="flex gap-1 font-mono font-extrabold text-sm" dir="ltr">
        {d > 0 && <TimeBox label="يوم">{pad(d)}</TimeBox>}
        <TimeBox label="س">{pad(h)}</TimeBox>
        <TimeBox label="د">{pad(m)}</TimeBox>
        <TimeBox label="ث">{pad(s)}</TimeBox>
      </div>
    </div>
  );
}

function TimeBox({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="min-w-8 px-1.5 py-1 rounded-lg bg-accent/20 text-accent">{children}</div>
      <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
