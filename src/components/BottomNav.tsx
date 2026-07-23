import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

const items: Array<{ to: string; label: string; Icon: typeof Home; badge?: boolean }> = [
  { to: "/", label: "الرئيسية", Icon: Home },
  { to: "/categories", label: "الأقسام", Icon: LayoutGrid },
  { to: "/cart", label: "السلة", Icon: ShoppingCart, badge: true },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  // Hide bottom nav on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 mx-auto max-w-md">
      <ul className="glass-strong rounded-2xl grid grid-cols-3 shadow-2xl">
        {items.map(({ to, label, Icon, badge }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to as "/"}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  {active && (
                    <span className="absolute -inset-2 rounded-xl bg-primary/15 blur-sm" />
                  )}
                  <Icon className="size-5 relative" strokeWidth={active ? 2.6 : 2} />
                  {badge && count > 0 && (
                    <span className="absolute -top-1.5 -left-2 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-extrabold flex items-center justify-center shadow">
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
