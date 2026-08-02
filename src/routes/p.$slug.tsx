import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import { productImages, hasActiveOffer, type LandingContent, type Product } from "@/lib/types";
import { ProductGallery } from "@/components/ProductGallery";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ShareButtons } from "@/components/ShareButtons";
import { ProductReviews } from "@/components/ProductReviews";
import { AppHeader } from "@/components/AppHeader";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CheckCircle2, Loader2, ShieldCheck, Star, Truck, XCircle } from "lucide-react";

export const Route = createFileRoute("/p/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `عرض خاص — ${params.slug} | تسوق Tasawa9` },
      {
        name: "description",
        content: "صفحة عرض خاصة: اطلب الآن مع الدفع عند الاستلام وتوصيل لجميع الولايات الجزائرية.",
      },
      { property: "og:title", content: "عرض خاص | تسوق Tasawa9" },
      {
        property: "og:description",
        content: "اطلب الآن مع الدفع عند الاستلام وتوصيل لجميع 58 ولاية.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
  errorComponent: () => (
    <div className="p-10 text-center text-destructive">تعذّر تحميل الصفحة</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">الصفحة غير موجودة</div>,
});

function LandingPage() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [qty, setQty] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["landing", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("landing_slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Product | null;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center gap-3 text-center">
        <p className="font-bold">هذه الصفحة غير متوفرة</p>
        <Link to="/" className="rounded-2xl btn-primary px-5 py-2.5 font-extrabold">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const p = data;
  const c: LandingContent | null = p.landing_content ?? null;
  const imgs = productImages(p);
  const subtotal = Number(p.price) * qty;

  const buy = () => {
    add({ id: p.id, title: p.title, price: Number(p.price), image_url: imgs[0] ?? null }, qty);
    setCheckout(true);
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-3 pb-32 pt-4">
        <section className="rounded-3xl glass p-4">
          <h1 className="text-xl font-extrabold leading-snug lg:text-3xl">
            {c?.headline || p.title}
          </h1>
          {c?.subheadline && (
            <p className="mt-2 text-sm text-muted-foreground">{c.subheadline}</p>
          )}
        </section>

        <div className="mt-4">
          <ProductGallery images={imgs} videoUrl={p.video_url} title={p.title} />
        </div>

        {hasActiveOffer(p) && (
          <div className="mt-4">
            <CountdownTimer target={p.offer_expires_at} />
          </div>
        )}

        <section className="mt-4 rounded-3xl glass p-4">
          <div className="flex items-end gap-3">
            <span className="text-2xl font-extrabold text-primary">{formatDZD(p.price)}</span>
            {p.old_price && Number(p.old_price) > Number(p.price) && (
              <span className="text-sm text-muted-foreground line-through">
                {formatDZD(p.old_price)}
              </span>
            )}
          </div>
          {p.stock > 0 && p.stock <= 5 && (
            <div className="mt-2 inline-flex rounded-full bg-destructive/15 px-3 py-1 text-xs font-extrabold text-destructive">
              بقي {p.stock} قطع فقط
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-bold">الكمية</span>
            <div className="flex items-center gap-2 rounded-2xl glass px-2 py-1">
              <button onClick={() => setQty((v) => Math.max(1, v - 1))} className="px-2 font-black">
                −
              </button>
              <span className="min-w-6 text-center font-extrabold">{qty}</span>
              <button onClick={() => setQty((v) => v + 1)} className="px-2 font-black">
                +
              </button>
            </div>
          </div>
          {p.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{p.description}</p>
          )}
        </section>

        {c && c.pains.length > 0 && (
          <section className="mt-4 rounded-3xl glass p-4">
            <h2 className="mb-2 text-sm font-extrabold">هل تعاني من هذا؟</h2>
            <ul className="space-y-2 text-sm">
              {c.pains.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {c && c.benefits.length > 0 && (
          <section className="mt-4 rounded-3xl glass p-4">
            <h2 className="mb-2 text-sm font-extrabold">الحل معنا</h2>
            <ul className="space-y-2 text-sm">
              {c.benefits.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl glass p-3 text-center">
            <Truck className="mx-auto size-5 text-primary" />
            <div className="mt-1 text-xs font-bold">توصيل 58 ولاية</div>
          </div>
          <div className="rounded-2xl glass p-3 text-center">
            <ShieldCheck className="mx-auto size-5 text-primary" />
            <div className="mt-1 text-xs font-bold">الدفع عند الاستلام</div>
          </div>
        </section>

        {c && c.reviews.length > 0 && (
          <section className="mt-4 space-y-2">
            <h2 className="px-1 text-sm font-extrabold">آراء الزبائن</h2>
            {c.reviews.map((r, i) => (
              <div key={i} className="rounded-2xl glass p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{r.name}</span>
                  <span className="text-[11px] text-muted-foreground">{r.wilaya}</span>
                  <span className="ml-auto flex">
                    {Array.from({ length: r.rating }).map((_, n) => (
                      <Star key={n} className="size-3.5 text-accent" fill="currentColor" />
                    ))}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </section>
        )}

        <div className="mt-4">
          <ShareButtons product={p} />
        </div>

        <div className="mt-4">
          <ProductReviews productId={p.id} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 glass-strong border-t border-border px-3 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="text-sm font-extrabold">{formatDZD(subtotal)}</div>
          <button
            onClick={buy}
            disabled={p.stock <= 0}
            className="h-12 flex-1 rounded-2xl btn-primary font-extrabold disabled:opacity-60"
          >
            {p.stock <= 0 ? "نفدت الكمية" : c?.cta || "اطلب الآن — الدفع عند الاستلام"}
          </button>
        </div>
      </div>

      <CheckoutModal open={checkout} onClose={() => setCheckout(false)} />
      <WhatsAppFab />
    </>
  );
}
