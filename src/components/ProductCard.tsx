import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { hasActiveOffer, productImages } from "@/lib/types";
import { ShoppingBag, Zap, Timer, Play } from "lucide-react";

export function ProductCard({
  product,
  onOpen,
  onBuy,
}: {
  product: Product;
  onOpen: (p: Product) => void;
  onBuy: (p: Product) => void;
}) {
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(100 - (Number(product.price) / Number(product.old_price)) * 100)
      : null;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const imgs = productImages(product);

  return (
    <div className="group overflow-hidden rounded-3xl glass transition duration-200 hover:-translate-y-0.5 hover:border-primary/40">
      <button
        onClick={() => onOpen(product)}
        className="relative block aspect-square w-full overflow-hidden bg-muted"
      >
        {imgs[0] ? (
          <img
            src={imgs[0]}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ShoppingBag className="size-10 opacity-40" />
          </div>
        )}
        {discount && (
          <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-extrabold text-destructive-foreground shadow">
            {`-${discount}%`}
          </span>
        )}
        {hasActiveOffer(product) && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-accent/95 px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground shadow">
            <Timer className="size-3" /> عرض مؤقت
          </span>
        )}
        {product.video_url && (
          <span className="absolute bottom-2 left-2 grid size-7 place-items-center rounded-full bg-black/60 text-white">
            <Play className="size-3.5" fill="currentColor" />
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-2 right-2 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-extrabold text-destructive-foreground shadow">
            بقي {product.stock} فقط
          </span>
        )}
      </button>
      <div className="space-y-1.5 p-2.5">
        <h3
          className="min-h-[2.5rem] cursor-pointer text-sm font-semibold line-clamp-2"
          onClick={() => onOpen(product)}
        >
          {product.title}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-primary">{formatDZD(product.price)}</span>
          {product.old_price ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatDZD(product.old_price)}
            </span>
          ) : null}
        </div>
        <button
          onClick={() => onBuy(product)}
          className="flex h-9 w-full items-center justify-center gap-1 rounded-xl btn-primary text-sm font-extrabold transition active:scale-[0.98]"
        >
          <Zap className="size-3.5" /> اشترِ الآن
        </button>
      </div>
    </div>
  );
}
