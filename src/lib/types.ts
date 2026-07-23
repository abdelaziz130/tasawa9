export type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  category: string | null;
  stock: number;
  created_at: string;
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
  created_at: string;
};

export type WilayaShipping = {
  id: string;
  wilaya_code: number;
  wilaya_name: string;
  home_fee: number;
  desk_fee: number;
};

export const ORDER_STATUSES = ["جديد", "مؤكد", "قيد الشحن", "تم التسليم", "ملغى"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
