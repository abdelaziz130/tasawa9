import { Flame } from "lucide-react";
import type { Product } from "@/lib/types";
import { hasActiveOffer, productImages } from "@/lib/types";
import { formatDZD } from "@/lib/format";
import { CountdownTimer } from "./CountdownTimer";

/** Products with a live offer expiry date, shown as a dedicated flash-deal rail. */
export function FlashDeals({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
}) {
  const deals = products
    .filter((p) => hasActiveOffer(p) && p.stock > 0)
    .sort(
      (a, b) =>
        new Date(a.offer_expires_at!).getTime() - new Date(b.offer_expires_at!).getTime(),
    );

  if (deals.length === 0) return null;
  const soonest = deals[0]!;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Flame className="size-4 text-accent" />
        <h2 className="text-sm font-extrabold">عروض مؤقتة</h2>
        <span className="text-[11px] text-muted-foreground">{deals.length} عرض</span>
      </div>
      <div className="mb-2">
        <CountdownTimer target={soonest.offer_expires_at} />
      </div>
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
        {deals.map((p) => {
          const img = productImages(p)[0];
          const off =
            p.old_price && p.old_price > p.price
              ? Math.round(100 - (Number(p.price) / Number(p.old_price)) * 100)
              : null;
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="w-36 shrink-0 overflow-hidden rounded-2xl glass text-right transition hover:border-primary/40"
            >
              <div className="relative aspect-square bg-muted">
                {img ? (
                  <img src={img} alt={p.title} loading="lazy" className="size-full object-cover" />
                ) : null}
                {off && (
                  <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-extrabold text-destructive-foreground">
                    {`-${off}%`}
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="line-clamp-2 min-h-8 text-[11px] font-semibold">{p.title}</div>
                <div className="mt-1 text-sm font-extrabold text-primary">
                  {formatDZD(p.price)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
