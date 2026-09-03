import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRecentPurchaseEvents } from "@/lib/storefront.functions";
import { ShoppingBag, X } from "lucide-react";

type PurchaseEvent = {
  id: string;
  first_name: string;
  wilaya: string;
  product_title: string;
  created_at: string;
};

const SEEN_KEY = "purchase_ticker_seen_v1";
const SHOW_MS = 150_000; // ~2.5 minutes on screen
const BREAK_MS = 120_000; // 2 minutes break
const BATCH = 5;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function readSeen(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function pushSeen(ids: string[]) {
  try {
    const next = Array.from(new Set([...readSeen(), ...ids])).slice(-200);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

/**
 * Thin right-to-left ticker bar showing REAL confirmed purchases only.
 * Rows land in `purchase_events` when an admin accepts an order.
 * Rules: today's orders only (yesterday's as fallback when today has none),
 * every event shown once per browser session, periodic show/break cycle.
 */
export function SocialProof() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => {
    setSeen(readSeen());
  }, []);

  const { data } = useQuery({
    queryKey: ["purchase-events-ticker"],
    queryFn: async () => {
      const all = (await getRecentPurchaseEvents()) as PurchaseEvent[];
      const today = startOfToday().getTime();
      const todays = all.filter((e) => new Date(e.created_at).getTime() >= today);
      if (todays.length > 0) return todays;
      const yesterday = today - 24 * 60 * 60 * 1000;
      return all.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return t >= yesterday && t < today;
      });
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  const batch = useMemo(() => {
    const list = (data ?? []).filter((e) => !seen.includes(e.id));
    return list.slice(0, BATCH);
  }, [data, seen, cycle]);

  // show / break cycle
  useEffect(() => {
    if (closed || batch.length === 0) return;
    setVisible(true);
    const hide = setTimeout(() => {
      setVisible(false);
      pushSeen(batch.map((e) => e.id));
      const next = setTimeout(() => {
        setSeen(readSeen());
        setCycle((c) => c + 1);
      }, BREAK_MS);
      timers.push(next);
    }, SHOW_MS);
    const timers: ReturnType<typeof setTimeout>[] = [hide];
    return () => timers.forEach(clearTimeout);
  }, [cycle, closed, batch.length]);

  if (closed || !visible || batch.length === 0) return null;

  const items = [...batch, ...batch];

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[84px] z-40 mx-auto max-w-md lg:max-w-3xl">
      <div className="pointer-events-auto flex items-center gap-2 overflow-hidden rounded-full glass-strong px-2 py-1.5 shadow-xl ring-1 ring-primary/25">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <ShoppingBag className="size-3.5" />
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max items-center gap-8 whitespace-nowrap text-[12px] font-semibold">
            {items.map((e, i) => (
              <span key={`${e.id}-${i}`} className="flex items-center gap-1.5">
                <span className="font-extrabold text-primary">{e.first_name}</span>
                <span className="text-muted-foreground">من {e.wilaya} اشترى</span>
                <span className="font-bold">«{e.product_title}»</span>
                <span className="text-muted-foreground">{timeAgo(e.created_at)}</span>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setClosed(true)}
          aria-label="إغلاق الشريط"
          className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <style>{`
        @keyframes tickerRTL { from { transform: translateX(0) } to { transform: translateX(50%) } }
        .ticker-track { animation: tickerRTL 26s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation-duration: 60s } }
      `}</style>
    </div>
  );
}
