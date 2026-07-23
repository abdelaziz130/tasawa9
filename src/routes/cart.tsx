import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CheckoutModal } from "@/components/CheckoutModal";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "السلة — متجر الجزائر" },
      { name: "description", content: "استعرض المنتجات في سلتك وأكمل الطلب." },
      { property: "og:title", content: "السلة — متجر الجزائر" },
      { property: "og:description", content: "أكمل طلبك مع الدفع عند الاستلام." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, remove, setQty } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <AppHeader />
      <main className="px-3 py-4 space-y-4">
        <h1 className="text-xl font-extrabold">السلة</h1>

        {items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground space-y-3">
            <ShoppingCart className="mx-auto size-12 opacity-40" />
            <p className="font-medium">السلة فارغة</p>
            <Link
              to="/"
              className="inline-block rounded-xl btn-primary px-5 py-2.5 text-sm font-bold"
            >
              تسوق الآن
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-2xl glass p-2.5">
                  <div className="size-20 rounded-xl bg-muted overflow-hidden shrink-0">
                    {i.image_url ? (
                      <img src={i.image_url} alt={i.title} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold line-clamp-2">{i.title}</h3>
                      <button
                        onClick={() => remove(i.id)}
                        className="text-destructive shrink-0 p-1 hover:bg-destructive/10 rounded-lg"
                        aria-label="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-lg overflow-hidden glass">
                        <button
                          onClick={() => setQty(i.id, i.quantity - 1)}
                          className="size-8 grid place-items-center hover:bg-white/5"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.id, i.quantity + 1)}
                          className="size-8 grid place-items-center hover:bg-white/5"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-extrabold text-primary">
                        {formatDZD(i.price * i.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="glass-strong rounded-2xl p-4 space-y-3 sticky bottom-24">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">المجموع (بدون التوصيل)</span>
                <span className="text-2xl font-extrabold text-primary">{formatDZD(total)}</span>
              </div>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="w-full h-12 rounded-xl btn-primary font-extrabold"
              >
                إتمام الطلب — الدفع عند الاستلام
              </button>
            </div>
          </>
        )}
      </main>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <WhatsAppFab />
    </>
  );
}
