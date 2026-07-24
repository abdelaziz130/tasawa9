import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

const NAMES = [
  "أمين", "ياسين", "محمد", "أحمد", "سفيان", "عبد الرحمن", "خالد", "بلال",
  "سمير", "رياض", "فاطمة", "مريم", "أميرة", "خديجة", "سارة", "نور",
];
const CITIES = [
  "وهران", "الجزائر", "قسنطينة", "عنابة", "سطيف", "باتنة", "بجاية",
  "تلمسان", "البليدة", "بومرداس", "تيزي وزو", "ورقلة", "مستغانم", "غليزان",
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function SocialProof() {
  const { data } = useQuery({
    queryKey: ["products-social"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("title,image_url").limit(30);
      return (data ?? []) as Pick<Product, "title" | "image_url">[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        const name = pick(NAMES);
        const city = pick(CITIES);
        const p = pick(data);
        const mins = 2 + Math.floor(Math.random() * 40);
        toast(
          `${name} من ${city} اشترى "${p.title}" قبل ${mins} دقيقة`,
          {
            icon: <ShoppingBag className="size-4 text-primary" />,
            duration: 4500,
          },
        );
        schedule(15000 + Math.random() * 15000);
      }, delay);
    };
    schedule(6000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data]);

  return null;
}
