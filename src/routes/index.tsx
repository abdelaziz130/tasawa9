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
import { Loader2, PackageSearch, Sparkles } from "lucide-react";

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

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

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
