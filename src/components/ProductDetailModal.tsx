import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { CountdownTimer } from "./CountdownTimer";
import { ProductReviews } from "./ProductReviews";
import { ShareButtons } from "./ShareButtons";
import { ProductGallery } from "./ProductGallery";
import { StickyBuyBar } from "./StickyBuyBar";
import { formatDZD } from "@/lib/format";
import type { Product } from "@/lib/types";
import { hasActiveOffer, productImages } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { ShieldCheck, Truck, PhoneCall, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

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
  const buyRef = useRef<HTMLDivElement | null>(null);
  if (!product) return null;

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(100 - (Number(product.price) / Number(product.old_price)) * 100)
      : null;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const maxQty = product.stock > 0 ? product.stock : 0;
  const addToCart = () =>
    add(
      {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image_url: productImages(product)[0] ?? null,
        stock: product.stock,
        free_shipping: !!product.free_shipping,
      },
      Math.min(qty, maxQty || 1),
    );

  return (
    <Modal open={open} onClose={onClose} title={product.title}>
      <div className="space-y-4 pb-20 lg:pb-4">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="relative">
            <ProductGallery
              images={productImages(product)}
              videoUrl={product.video_url}
              title={product.title}
            />
            {discount && (
              <span className="absolute top-3 right-3 rounded-full bg-destructive px-3 py-1 text-sm font-extrabold text-destructive-foreground shadow-lg">
                {`-${discount}%`}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-4 lg:mt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">
                {formatDZD(product.price)}
              </span>
              {product.old_price ? (
                <span className="text-sm text-muted-foreground line-through">
                  {formatDZD(product.old_price)}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {lowStock && (
                <span className="animate-pulse rounded-full bg-destructive/20 px-2.5 py-1 font-bold text-destructive">
                  🔥 بقي {product.stock} قطع فقط
                </span>
              )}
              {product.stock > 5 && (
                <span className="rounded-full bg-success/20 px-2.5 py-1 font-bold text-success">
                  متوفر
                </span>
              )}
              {product.stock <= 0 && (
                <span className="rounded-full bg-destructive/20 px-2.5 py-1 font-bold text-destructive">
                  نفذ المخزون
                </span>
              )}
              {product.category && (
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
                  {product.category}
                </span>
              )}
              {(product.tags ?? []).slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>

            {product.stock > 0 && hasActiveOffer(product) && (
              <CountdownTimer target={product.offer_expires_at} />
            )}

            {product.free_shipping && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-extrabold text-success">
                <Truck className="size-3.5" /> توصيل مجاني
              </div>
            )}

            {product.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
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
              <div className="flex items-center overflow-hidden rounded-xl glass">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="size-9 hover:bg-primary/10"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => {
                      if (maxQty && q >= maxQty) {
                        toast.error(`المخزون المتوفر حالياً هو ${maxQty} قطع فقط`);
                        return q;
                      }
                      return q + 1;
                    })
                  }
                  className="size-9 hover:bg-primary/10"
                >
                  +
                </button>
              </div>
              {maxQty > 0 && (
                <span className="text-xs text-muted-foreground">المتوفر: {maxQty}</span>
              )}
            </div>

            <div ref={buyRef} className="grid grid-cols-5 gap-2">
              <button
                onClick={() => {
                  addToCart();
                  onClose();
                }}
                disabled={product.stock <= 0}
                className="col-span-2 flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 border-primary text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <ShoppingCart className="size-4" /> السلة
              </button>
              <button
                onClick={() => {
                  addToCart();
                  onBuyNow(product);
                }}
                disabled={product.stock <= 0}
                className="col-span-3 flex h-12 items-center justify-center gap-1.5 rounded-2xl btn-primary font-extrabold disabled:opacity-50"
              >
                <Zap className="size-4" /> اشترِ الآن
              </button>
            </div>

            <ShareButtons product={product} />
          </div>
        </div>

        <ProductReviews productId={product.id} />
      </div>

      <StickyBuyBar
        product={product}
        watchRef={buyRef}
        onBuy={() => {
          addToCart();
          onBuyNow(product);
        }}
      />
    </Modal>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl glass p-2.5 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] font-semibold leading-tight">{label}</span>
    </div>
  );
}
