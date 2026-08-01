import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";

type PurchaseEvent = {
  id: string;
  first_name: string;
  wilaya: string;
  product_title: string;
  created_at: string;
};

function minutesAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  return `قبل ${Math.round(h / 24)} يوم`;
}

/**
 * Shows purchase toasts for REAL confirmed orders only.
 * Rows land in `purchase_events` when an admin accepts an order.
 */
export function SocialProof() {
  const shown = useRef<Set<string>>(new Set());
  const queue = useRef<PurchaseEvent[]>([]);

  const { data } = useQuery({
    queryKey: ["purchase-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_events")
        .select("id,first_name,wilaya,product_title,created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as PurchaseEvent[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data?.length) return;
    for (const e of data) {
      if (!shown.current.has(e.id)) queue.current.push(e);
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        const e = queue.current.shift();
        if (e && !shown.current.has(e.id)) {
          shown.current.add(e.id);
          toast(`${e.first_name} من ${e.wilaya} اشترى "${e.product_title}" ${minutesAgo(e.created_at)}`, {
            icon: <ShoppingBag className="size-4 text-primary" />,
            duration: 4500,
          });
        }
        if (queue.current.length) step(18_000);
      }, delay);
    };
    step(7000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data]);

  return null;
}
