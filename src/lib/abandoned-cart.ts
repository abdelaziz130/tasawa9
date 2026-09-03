import type { CartItem } from "@/lib/cart";
import { saveAbandonedCart } from "@/lib/storefront.functions";

const ID_KEY = "abandoned_cart_id";

export type AbandonedDraft = {
  customer_name?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  cart_items: Array<Pick<CartItem, "id" | "title" | "price" | "quantity">>;
  subtotal: number;
};

export async function trackAbandonedCart(draft: AbandonedDraft) {
  // Only track when we have at least a phone or name AND items
  if (!draft.cart_items.length) return;
  if (!draft.phone?.trim() && !draft.customer_name?.trim()) return;

  let id: string | null = null;
  try {
    id = localStorage.getItem(ID_KEY);
  } catch {}

  const res = await saveAbandonedCart({
    data: {
      id,
      customer_name: draft.customer_name ?? null,
      phone: draft.phone ?? null,
      wilaya: draft.wilaya ?? null,
      commune: draft.commune ?? null,
      cart_items: draft.cart_items.map((i) => ({
        id: String(i.id),
        title: String(i.title),
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
      subtotal: Number(draft.subtotal),
    },
  });

  if (res?.id) {
    try {
      localStorage.setItem(ID_KEY, res.id);
    } catch {}
  }
}

export function clearAbandonedCart() {
  try {
    localStorage.removeItem(ID_KEY);
  } catch {}
}
