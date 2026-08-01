export type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  images: string[];
  video_url: string | null;
  tags: string[];
  offer_expires_at: string | null;
  landing_slug: string | null;
  landing_content: LandingContent | null;
  category: string | null;
  stock: number;
  created_at: string;
};

export type LandingContent = {
  headline: string;
  subheadline: string;
  pains: string[];
  benefits: string[];
  reviews: { name: string; wilaya: string; rating: number; text: string }[];
  cta: string;
};

export type CartItemLite = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  delivery_type: string;
  shipping_fee: number;
  cart_items: CartItemLite[];
  total_price: number;
  status: string;
  refusal_reason: string | null;
  created_at: string;
};

export type WilayaShipping = {
  id: string;
  wilaya_code: number;
  wilaya_name: string;
  home_fee: number;
  desk_fee: number;
};

export type StaffMember = {
  id: string;
  user_id: string;
  email: string;
  role: "admin" | "sub_admin";
  created_at: string;
};

export const ORDER_STATUSES = ["جديد", "مؤكد", "قيد الشحن", "تم التسليم", "مرفوض", "ملغى"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** products are hidden from the storefront when out of stock */
export function isVisibleInStore(p: Pick<Product, "stock">) {
  return Number(p.stock) > 0;
}

export function hasActiveOffer(p: Pick<Product, "offer_expires_at">) {
  if (!p.offer_expires_at) return false;
  return new Date(p.offer_expires_at).getTime() > Date.now();
}

export function productImages(p: Pick<Product, "image_url" | "images">): string[] {
  const extra = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const all = [p.image_url, ...extra].filter((s): s is string => !!s);
  return Array.from(new Set(all));
}
