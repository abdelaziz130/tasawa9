import { useState } from "react";
import { Modal } from "./Modal";
import { CountdownTimer } from "./CountdownTimer";
import { ProductReviews } from "./ProductReviews";
import { ShareButtons } from "./ShareButtons";
import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { ShieldCheck, Truck, PhoneCall, ShoppingCart, Zap } from "lucide-react";

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
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Modal open={open} onClose={onClose} title={product.title}>
      <div className="space-y-4 pb-20">
        <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground">لا صورة</div>
          )}
          {discount && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm font-extrabold px-3 py-1 rounded-full shadow-lg">
              {`-${discount}%`}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-primary font-extrabold text-3xl">{formatDZD(product.price)}</span>
          {product.old_price ? (
            <span className="text-muted-foreground line-through text-sm">
              {formatDZD(product.old_price)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {lowStock && (
            <span className="px-2.5 py-1 rounded-full font-bold bg-destructive/20 text-destructive animate-pulse">
              🔥 بقي {product.stock} قطع فقط
            </span>
          )}
          {product.stock > 5 && (
            <span className="px-2.5 py-1 rounded-full font-bold bg-success/20 text-success">
              متوفر
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2.5 py-1 rounded-full font-bold bg-destructive/20 text-destructive">
              نفذ المخزون
            </span>
          )}
          {product.category && (
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
              {product.category}
            </span>
          )}
        </div>

        {product.stock > 0 && <CountdownTimer />}

        {product.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Benefit icon={<Truck className="size-5" />} label="توصيل لكل الولايات" />
          <Benefit icon={<ShieldCheck className="size-5" />} label="دفع عند الاستلام" />
          <Benefit icon={<PhoneCall className="size-5" />} label="تأكيد هاتفي" />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">الكمية:</label>
          <div className="flex items-center rounded-xl glass overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="size-9 hover:bg-white/5"
            >
              −
            </button>
            <span className="w-10 text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
              className="size-9 hover:bg-white/5"
            >
              +
            </button>
          </div>
        </div>

        <ShareButtons product={product} />

        <ProductReviews productId={product.id} />
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-4 -mb-4 px-4 py-3 glass-strong border-t border-white/10 grid grid-cols-5 gap-2">
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
          className="col-span-2 h-12 rounded-2xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-1.5 hover:bg-primary/10 disabled:opacity-50 text-sm"
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
          className="col-span-3 h-12 rounded-2xl btn-primary font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Zap className="size-4" /> اشترِ الآن
        </button>
      </div>
    </Modal>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="glass rounded-2xl p-2.5 flex flex-col items-center gap-1 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] font-semibold leading-tight">{label}</span>
    </div>
  );
}
