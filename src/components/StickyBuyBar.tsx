import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { productImages } from "@/lib/types";

/** Floating bar that appears once the main buy button scrolls out of view. */
export function StickyBuyBar({
  product,
  watchRef,
  onBuy,
}: {
  product: Product;
  watchRef: React.RefObject<HTMLElement | null>;
  onBuy: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry?.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);

  if (!show || product.stock <= 0) return null;
  const img = productImages(product)[0];

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border glass-strong px-3 py-2.5 animate-in slide-in-from-bottom-4">
      <div className="mx-auto max-w-md lg:max-w-3xl flex items-center gap-3">
        {img ? (
          <img src={img} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="size-11 shrink-0 rounded-xl bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold">{product.title}</div>
          <div className="text-sm font-extrabold text-primary">{formatDZD(product.price)}</div>
        </div>
        <button
          onClick={onBuy}
          className="h-11 shrink-0 rounded-2xl btn-primary px-5 text-sm font-extrabold flex items-center gap-1.5"
        >
          <Zap className="size-4" /> اشترِ الآن
        </button>
      </div>
    </div>
  );
}
