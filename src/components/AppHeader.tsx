import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function AppHeader({
  search,
  onSearch,
}: {
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-gradient-to-b from-primary to-primary-glow text-primary-foreground shadow-sm">
      <div className="mx-auto max-w-md px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <ShoppingBag className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight">متجر الجزائر</div>
              <div className="text-[11px] opacity-80">توصيل لجميع الولايات</div>
            </div>
          </Link>
          <Link
            to="/cart"
            className="relative grid size-10 place-items-center rounded-xl bg-white/15 hover:bg-white/25 transition"
            aria-label="السلة"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
        {onSearch && (
          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full h-11 rounded-xl bg-white text-foreground pr-10 pl-4 text-sm outline-none ring-0 focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}
