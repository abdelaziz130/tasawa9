import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { StoriesBanner } from "@/components/StoriesBanner";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { Loader2, PackageSearch, Sparkles, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "متجر الجزائر — تسوق أونلاين مع الدفع عند الاستلام" },
      {
        name: "description",
        content: "متجر إلكتروني جزائري: تصفح المنتجات واطلب الدفع عند الاستلام مع توصيل لجميع 58 ولاية.",
      },
      { property: "og:title", content: "متجر الجزائر" },
      { property: "og:description", content: "تسوق أونلاين مع الدفع عند الاستلام." },
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [data]);

  const priceMax = useMemo(() => {
    return (data ?? []).reduce((m, p) => Math.max(m, Number(p.price) || 0), 0);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((p) => {
      if (category && p.category !== category) return false;
      if (maxPrice != null && Number(p.price) > maxPrice) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, category, maxPrice]);

  const openProduct = (p: Product) => {
    setSelected(p);
    setDetailOpen(true);
  };

  return (
    <>
      <AppHeader search={search} onSearch={setSearch} />
      <main className="px-3 py-4">
        {/* Hero */}
        <div className="mb-4 rounded-3xl glass p-4 relative overflow-hidden">
          <div className="absolute -top-6 -left-6 size-24 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-8 -right-6 size-28 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="text-3xl">🚚</div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold">
                <Sparkles className="size-4 text-accent" /> توصيل سريع لجميع الولايات
              </div>
              <div className="text-xs text-muted-foreground">
                الدفع عند الاستلام في 58 ولاية
              </div>
            </div>
          </div>
        </div>

        <StoriesBanner products={data ?? []} onOpen={openProduct} />

        {/* Filters */}
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="h-9 px-3 rounded-full glass text-xs font-bold flex items-center gap-1.5"
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
              className="text-xs text-muted-foreground underline"
            >
              مسح
            </button>
          )}
          <span className="text-xs text-muted-foreground mr-auto">{filtered.length} منتج</span>
        </div>
        {showFilters && (
          <div className="mb-4 rounded-2xl glass p-3 space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={openProduct} onBuy={openProduct} />
            ))}
          </div>
        )}
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
      <WhatsAppFab />
    </>
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
