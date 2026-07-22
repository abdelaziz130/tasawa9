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

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  delivery_type: string;
  cart_items: Array<{ id: string; title: string; price: number; quantity: number }>;
  total_price: number;
  status: string;
  created_at: string;
};

export const ORDER_STATUSES = ["جديد", "مؤكد", "تم الشحن", "تم التسليم", "ملغى"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
