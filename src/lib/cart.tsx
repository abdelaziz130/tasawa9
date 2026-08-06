import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  quantity: number;
  /** available stock at the time the item was added (null = unknown/unlimited) */
  stock?: number | null;
  /** product ships for free */
  free_shipping?: boolean;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "shop_cart_v1";

function clampQty(qty: number, stock?: number | null) {
  if (stock == null || !Number.isFinite(stock) || stock <= 0) return Math.max(1, qty);
  if (qty > stock) {
    toast.error(`المخزون المتوفر حالياً هو ${stock} قطع فقط`);
    return stock;
  }
  return Math.max(1, qty);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * Number(i.price), 0);
    return {
      items,
      count,
      total,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found)
            return prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    ...item,
                    quantity: clampQty(p.quantity + qty, item.stock ?? p.stock),
                  }
                : p,
            );
          return [...prev, { ...item, quantity: clampQty(qty, item.stock) }];
        }),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          prev.flatMap((p) =>
            p.id === id ? (qty <= 0 ? [] : [{ ...p, quantity: clampQty(qty, p.stock) }]) : [p],
          ),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
