import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public storefront server functions.
 * These exist so the browser never needs direct table access to
 * `coupons`, `abandoned_carts`, `purchase_events` or write access to the
 * `review-photos` storage bucket. All privileged work happens here, behind
 * strict validation, and only safe fields are returned to the client.
 */

const couponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().finite().min(0),
});

export type PublicCoupon = {
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
};

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => couponSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: row } = await supabaseAdmin
      .from("coupons")
      .select("id,code,discount_type,discount_value,min_order,expires_at,usage_limit,times_used")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    if (!row) return { ok: false as const, reason: "invalid" as const };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now())
      return { ok: false as const, reason: "expired" as const };
    if (row.usage_limit != null && Number(row.times_used) >= Number(row.usage_limit))
      return { ok: false as const, reason: "exhausted" as const };
    if (data.subtotal < Number(row.min_order))
      return { ok: false as const, reason: "min_order" as const, min_order: Number(row.min_order) };

    const coupon: PublicCoupon = {
      code: row.code,
      discount_type: row.discount_type,
      discount_value: Number(row.discount_value),
      min_order: Number(row.min_order),
    };
    return { ok: true as const, coupon };
  });

export const redeemCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: row } = await supabaseAdmin
      .from("coupons")
      .select("id,times_used")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (!row) return { ok: false as const };
    await supabaseAdmin
      .from("coupons")
      .update({ times_used: Number(row.times_used) + 1 })
      .eq("id", row.id);
    return { ok: true as const };
  });

const cartItemSchema = z.object({
  id: z.string().max(64),
  title: z.string().max(300),
  price: z.number().finite().min(0),
  quantity: z.number().int().min(1).max(999),
});

const abandonedSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  customer_name: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  wilaya: z.string().trim().max(120).nullable().optional(),
  commune: z.string().trim().max(120).nullable().optional(),
  cart_items: z.array(cartItemSchema).min(1).max(50),
  subtotal: z.number().finite().min(0),
});

export const saveAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => abandonedSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      customer_name: data.customer_name ?? null,
      phone: data.phone ?? null,
      wilaya: data.wilaya ?? null,
      commune: data.commune ?? null,
      cart_items: data.cart_items,
      subtotal: data.subtotal,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: updated } = await supabaseAdmin
        .from("abandoned_carts")
        .update(payload)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (updated?.id) return { id: updated.id as string };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("abandoned_carts")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error("could not save cart");
    return { id: inserted.id as string };
  });

export type TickerEvent = {
  id: string;
  first_name: string;
  wilaya: string;
  product_title: string;
  created_at: string;
};

/** Recent confirmed purchases for the social-proof ticker (limited window + rows). */
export const getRecentPurchaseEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("purchase_events")
    .select("id,first_name,wilaya,product_title,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as TickerEvent[];
});

const photoSchema = z.object({
  product_id: z.string().uuid(),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  // base64 (no data-url prefix); ~5MB binary max
  base64: z.string().min(16).max(7_500_000),
});

export const uploadReviewPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => photoSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024)
      throw new Error("invalid image size");

    const ext =
      data.content_type === "image/png" ? "png" : data.content_type === "image/webp" ? "webp" : "jpg";
    const path = `${data.product_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("review-photos")
      .upload(path, bytes, { contentType: data.content_type, cacheControl: "3600", upsert: false });
    if (error) throw new Error("upload failed");

    const { data: pub } = supabaseAdmin.storage.from("review-photos").getPublicUrl(path);
    return { url: pub.publicUrl };
  });
