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
    <header className="sticky top-0 z-30 glass-strong border-b border-white/5">
      <div className="mx-auto max-w-md px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-2xl btn-primary">
              <ShoppingBag className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight bg-gradient-to-l from-primary to-primary-glow bg-clip-text text-transparent">
                متجر الجزائر
              </div>
              <div className="text-[11px] text-muted-foreground">توصيل لجميع الولايات</div>
            </div>
          </Link>
          <Link
            to="/cart"
            className="relative grid size-10 place-items-center rounded-2xl glass hover:bg-white/10 transition"
            aria-label="السلة"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[11px] font-extrabold flex items-center justify-center">
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
              className="w-full h-11 rounded-2xl glass text-foreground pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}
