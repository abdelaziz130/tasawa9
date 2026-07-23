import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { Loader2, Tag } from "lucide-react";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "الأقسام — متجر الجزائر" },
      { name: "description", content: "تصفح المنتجات حسب القسم." },
      { property: "og:title", content: "الأقسام — متجر الجزائر" },
      { property: "og:description", content: "تصفح المنتجات حسب القسم." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { data, isLoading } = useQuery({
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

  const filtered = useMemo(
    () => (selectedCat ? (data ?? []).filter((p) => p.category === selectedCat) : data ?? []),
    [data, selectedCat],
  );

  return (
    <>
      <AppHeader />
      <main className="px-3 py-4 space-y-4">
        <h1 className="text-xl font-extrabold">الأقسام</h1>
        {isLoading ? (
          <div className="py-20 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">لا توجد أقسام بعد</div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
              <CatChip
                label="الكل"
                active={!selectedCat}
                onClick={() => setSelectedCat(null)}
              />
              {categories.map((c) => (
                <CatChip
                  key={c}
                  label={c}
                  active={selectedCat === c}
                  onClick={() => setSelectedCat(c)}
                />
              ))}
            </div>
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
          </>
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

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-9 px-4 rounded-full text-sm font-bold flex items-center gap-1.5 transition ${
        active
          ? "btn-primary"
          : "glass text-secondary-foreground hover:bg-white/5"
      }`}
    >
      <Tag className="size-3.5" />
      {label}
    </button>
  );
}
