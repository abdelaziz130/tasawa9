import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { StoriesBanner } from "@/components/StoriesBanner";
import { FlashDeals } from "@/components/FlashDeals";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatDZD } from "@/lib/format";
import { isVisibleInStore, type Product } from "@/lib/types";
import {
  Loader2,
  PackageSearch,
  Sparkles,
  SlidersHorizontal,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسوق | Tasawa9 — تسوق أونلاين مع الدفع عند الاستلام" },
      {
        name: "description",
        content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية.",
      },
      { property: "og:title", content: "تسوق | Tasawa9 — تسوق أونلاين مع الدفع عند الاستلام" },
      { property: "og:description", content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const inStock = useMemo(() => (data ?? []).filter(isVisibleInStore), [data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [data]);

  const priceMax = useMemo(
    () => (data ?? []).reduce((m, p) => Math.max(m, Number(p.price) || 0), 0),
    [data],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      if (!isVisibleInStore(p)) return false;
      if (category && p.category !== category) return false;
      if (maxPrice != null && Number(p.price) > maxPrice) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, category, maxPrice]);

  const openProduct = (p: Product) => {
    setSelected(p);
    setDetailOpen(true);
  };

  const filterControls = (
    <FilterControls
      categories={categories}
      category={category}
      setCategory={setCategory}
      priceMax={priceMax}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
    />
  );

  return (
    <>
      <AppHeader search={search} onSearch={setSearch} />
      <main className="px-3 py-4 lg:px-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left: sticky filters (desktop only) */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-3 rounded-3xl glass p-4">
              <div className="flex items-center gap-1.5 text-sm font-extrabold">
                <SlidersHorizontal className="size-4 text-primary" /> الأقسام والفلاتر
              </div>
              {filterControls}
              {(category || maxPrice != null) && (
                <button
                  onClick={() => {
                    setCategory(null);
                    setMaxPrice(null);
                  }}
                  className="h-9 w-full rounded-xl glass text-xs font-bold"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          </aside>

          {/* Center: content */}
          <div className="lg:col-span-6">
            <div className="mb-4 rounded-3xl glass p-4 relative overflow-hidden">
              <div className="absolute -top-6 -left-6 size-24 rounded-full bg-primary/20 blur-2xl" />
              <div className="absolute -bottom-8 -right-6 size-28 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="text-3xl">🚚</div>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold">
                    توصيل سريع لجميع الولايات
                  </div>
                  <div className="text-xs text-muted-foreground">
                    الدفع عند الاستلام في 58 ولاية
                  </div>
                </div>
              </div>
            </div>

            <StoriesBanner products={inStock} onOpen={openProduct} />
            <FlashDeals products={inStock} onOpen={openProduct} />

            {/* Mobile filters toggle */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="h-9 px-3 rounded-full glass text-xs font-bold flex items-center gap-1.5 lg:hidden"
              >
                <SlidersHorizontal className="size-3.5" />
                الفلاتر
                {(category || maxPrice != null) && (
                  <span className="size-1.5 rounded-full bg-accent" />
                )}
              </button>
              {(category || maxPrice != null) && (
                <button
                  onClick={() => {
                    setCategory(null);
                    setMaxPrice(null);
                  }}
                  className="text-xs text-muted-foreground underline lg:hidden"
                >
                  مسح
                </button>
              )}
              <span className="text-xs text-muted-foreground mr-auto">{filtered.length} منتج</span>
            </div>
            {showFilters && (
              <div className="mb-4 rounded-2xl glass p-3 space-y-3 lg:hidden">{filterControls}</div>
            )}

            {isLoading ? (
              <div className="py-20 grid place-items-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="py-10 text-center text-destructive">تعذّر تحميل المنتجات</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <PackageSearch className="mx-auto size-10 opacity-50" />
                <p className="font-medium">لا توجد منتجات{search ? " مطابقة" : " بعد"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={openProduct} onBuy={openProduct} />
                ))}
              </div>
            )}
          </div>

          {/* Right: quick cart (desktop only) */}
          <aside className="hidden lg:col-span-3 lg:block">
            <QuickCartPanel onCheckout={() => setCheckoutOpen(true)} />
          </aside>
        </div>
      </main>

      <ProductDetailModal
        product={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onBuyNow={() => {
          setDetailOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

function FilterControls({
  categories,
  category,
  setCategory,
  priceMax,
  maxPrice,
  setMaxPrice,
}: {
  categories: string[];
  category: string | null;
  setCategory: (c: string | null) => void;
  priceMax: number;
  maxPrice: number | null;
  setMaxPrice: (n: number) => void;
}) {
  return (
    <div className="space-y-3">
      {categories.length > 0 && (
        <div>
          <div className="text-xs font-bold mb-1.5">القسم</div>
          <div className="flex gap-1.5 flex-wrap">
            <Chip active={!category} onClick={() => setCategory(null)}>
              الكل
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {priceMax > 0 && (
        <div>
          <div className="text-xs font-bold mb-1.5 flex items-center justify-between">
            <span>السعر الأقصى</span>
            <span className="text-muted-foreground">
              {maxPrice != null ? `${maxPrice.toLocaleString()} دج` : "بلا حد"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.ceil(priceMax)}
            step={Math.max(100, Math.round(priceMax / 100))}
            value={maxPrice ?? priceMax}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}
    </div>
  );
}

function QuickCartPanel({ onCheckout }: { onCheckout: () => void }) {
  const { items, total, count, setQty, remove } = useCart();
  return (
    <div className="sticky top-24 space-y-3 rounded-3xl glass p-4">
      <div className="flex items-center gap-1.5 text-sm font-extrabold">
        <ShoppingBag className="size-4 text-primary" /> سلة التسوق
        {count > 0 && (
          <span className="mr-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-accent-foreground">
            {count}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">سلتك فارغة</p>
      ) : (
        <>
          <ul className="max-h-[46vh] space-y-2 overflow-y-auto">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2 rounded-2xl glass p-2">
                {i.image_url ? (
                  <img
                    src={i.image_url}
                    alt={i.title}
                    className="size-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
                    <PackageSearch className="size-4 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-xs font-bold">{i.title}</div>
                  <div className="text-[11px] text-primary font-extrabold">
                    {formatDZD(i.price * i.quantity)}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      onClick={() => setQty(i.id, i.quantity - 1)}
                      aria-label="تقليل"
                      className="grid size-6 place-items-center rounded-lg glass"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{i.quantity}</span>
                    <button
                      onClick={() => setQty(i.id, i.quantity + 1)}
                      aria-label="زيادة"
                      className="grid size-6 place-items-center rounded-lg glass"
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      onClick={() => remove(i.id)}
                      aria-label="حذف"
                      className="mr-auto grid size-6 place-items-center rounded-lg bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-extrabold">
            <span>الإجمالي</span>
            <span className="text-primary">{formatDZD(total)}</span>
          </div>
          <button onClick={onCheckout} className="h-11 w-full rounded-2xl btn-primary font-extrabold">
            إتمام الطلب
          </button>
          <Link
            to="/cart"
            className="grid h-10 w-full place-items-center rounded-2xl glass text-xs font-bold"
          >
            عرض السلة كاملة
          </Link>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-full text-xs font-bold transition ${
        active ? "btn-primary" : "glass text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
