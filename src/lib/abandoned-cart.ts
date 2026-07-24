import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

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

  const payload = {
    customer_name: draft.customer_name ?? null,
    phone: draft.phone ?? null,
    wilaya: draft.wilaya ?? null,
    commune: draft.commune ?? null,
    cart_items: draft.cart_items,
    subtotal: draft.subtotal,
    updated_at: new Date().toISOString(),
  };

  let id: string | null = null;
  try {
    id = localStorage.getItem(ID_KEY);
  } catch {}

  if (id) {
    const { error } = await supabase.from("abandoned_carts").update(payload).eq("id", id);
    if (!error) return;
  }
  const { data } = await supabase
    .from("abandoned_carts")
    .insert(payload)
    .select("id")
    .single();
  if (data?.id) {
    try {
      localStorage.setItem(ID_KEY, data.id);
    } catch {}
  }
}

export function clearAbandonedCart() {
  try {
    localStorage.removeItem(ID_KEY);
  } catch {}
}
