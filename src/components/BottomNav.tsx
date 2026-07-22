import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, Settings } from "lucide-react";
import { useCart } from "@/lib/cart";

const items = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/categories", label: "الأقسام", Icon: LayoutGrid },
  { to: "/cart", label: "السلة", Icon: ShoppingCart, badge: true },
  { to: "/admin", label: "لوحة التحكم", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, label, Icon, badge }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 2} />
                  {badge && count > 0 && (
                    <span className="absolute -top-1.5 -left-2 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
