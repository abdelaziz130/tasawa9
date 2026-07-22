import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

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

  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition">
      <button
        onClick={() => onOpen(product)}
        className="block w-full aspect-square bg-muted relative overflow-hidden"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground">
            <ShoppingBag className="size-10 opacity-40" />
          </div>
        )}
        {discount && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
            {`-${discount}%`}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-white text-sm font-bold">
            نفذ المخزون
          </span>
        )}
      </button>
      <div className="p-2.5 space-y-1.5">
        <h3
          className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] cursor-pointer"
          onClick={() => onOpen(product)}
        >
          {product.title}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-primary font-extrabold text-base">{formatDZD(product.price)}</span>
          {product.old_price ? (
            <span className="text-muted-foreground line-through text-xs">
              {formatDZD(product.old_price)}
            </span>
          ) : null}
        </div>
        <button
          onClick={() => onBuy(product)}
          disabled={product.stock <= 0}
          className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          اشترِ الآن
        </button>
      </div>
    </div>
  );
}
