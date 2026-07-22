import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { Loader2, PackageSearch } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "متجر الجزائر — الرئيسية" },
      {
        name: "description",
        content: "استعرض أحدث المنتجات مع الدفع عند الاستلام في جميع ولايات الجزائر.",
      },
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

  return (
    <>
      <AppHeader search={search} onSearch={setSearch} />
      <main className="px-3 py-4">
        <div className="mb-3 rounded-2xl bg-gradient-to-l from-accent/20 to-primary/10 border border-accent/30 p-3 flex items-center gap-3">
          <div className="text-2xl">🚚</div>
          <div className="text-sm">
            <div className="font-bold">توصيل سريع لجميع الولايات</div>
            <div className="text-muted-foreground text-xs">الدفع عند الاستلام</div>
          </div>
        </div>

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
              <ProductCard
                key={p.id}
                product={p}
                onOpen={(prod) => {
                  setSelected(prod);
                  setDetailOpen(true);
                }}
                onBuy={(prod) => {
                  setSelected(prod);
                  setDetailOpen(true);
                }}
              />
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
    </>
  );
}
