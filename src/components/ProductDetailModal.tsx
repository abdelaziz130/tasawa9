import { useState } from "react";
import { Modal } from "./Modal";
import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { ShoppingCart, Zap } from "lucide-react";

export function ProductDetailModal({
  product,
  open,
  onClose,
  onBuyNow,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onBuyNow: (p: Product) => void;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(100 - (Number(product.price) / Number(product.old_price)) * 100)
      : null;

  return (
    <Modal open={open} onClose={onClose} title={product.title}>
      <div className="space-y-4">
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground">لا صورة</div>
          )}
          {discount && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm font-bold px-2.5 py-1 rounded-full">
              {`-${discount}%`}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-primary font-extrabold text-2xl">{formatDZD(product.price)}</span>
          {product.old_price ? (
            <span className="text-muted-foreground line-through">
              {formatDZD(product.old_price)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${
              product.stock > 0
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {product.stock > 0 ? `متوفر (${product.stock})` : "نفذ المخزون"}
          </span>
          {product.category && (
            <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
              {product.category}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">الكمية:</label>
          <div className="flex items-center rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="size-9 hover:bg-muted"
            >
              −
            </button>
            <span className="w-10 text-center font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
              className="size-9 hover:bg-muted"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => {
              add(
                {
                  id: product.id,
                  title: product.title,
                  price: Number(product.price),
                  image_url: product.image_url,
                },
                qty,
              );
              onClose();
            }}
            disabled={product.stock <= 0}
            className="h-12 rounded-xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 disabled:opacity-50"
          >
            <ShoppingCart className="size-4" /> السلة
          </button>
          <button
            onClick={() => {
              add(
                {
                  id: product.id,
                  title: product.title,
                  price: Number(product.price),
                  image_url: product.image_url,
                },
                qty,
              );
              onBuyNow(product);
            }}
            disabled={product.stock <= 0}
            className="h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            <Zap className="size-4" /> اشترِ الآن
          </button>
        </div>
      </div>
    </Modal>
  );
}
