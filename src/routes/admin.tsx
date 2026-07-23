import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import type { CartItemLite, Order, Product } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  ImagePlus,
  LogOut,
  X,
  Lock,
  PhoneCall,
  MessageCircle,
  Home,
} from "lucide-react";

const ADMIN_EMAIL = "chaib.aziz2004@gmail.com";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — متجر الجزائر" },
      { name: "description", content: "إدارة المنتجات والطلبات." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
  if (!session || !isAdmin) return <AdminLogin loggedIn={!!session} />;

  return (
    <main className="min-h-dvh px-3 py-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">لوحة التحكم</h1>
          <div className="text-xs text-muted-foreground">{session.user.email}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate({ to: "/" })}
            className="size-9 grid place-items-center rounded-xl glass hover:bg-white/10"
            aria-label="الرئيسية"
          >
            <Home className="size-4" />
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("تم تسجيل الخروج");
            }}
            className="h-9 px-3 rounded-xl glass text-sm font-bold flex items-center gap-1"
          >
            <LogOut className="size-4" /> خروج
          </button>
        </div>
      </div>

      <StatsCards />

      <div className="grid grid-cols-2 gap-2 rounded-2xl glass p-1">
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
          الطلبات
        </TabBtn>
        <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
          المنتجات
        </TabBtn>
      </div>

      {tab === "orders" ? <OrdersPanel /> : <ProductsPanel />}
    </main>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-xl text-sm font-bold transition ${
        active ? "btn-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AdminLogin({ loggedIn }: { loggedIn: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Kick off bootstrap for the admin user (idempotent)
  useEffect(() => {
    fetch("/api/public/setup-admin").catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    // Retry once after triggering the setup route in case the admin wasn't provisioned yet
    if (error) {
      try {
        await fetch("/api/public/setup-admin");
      } catch {}
      const retry = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      error = retry.error;
    }
    setBusy(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    // If a non-admin logs in, redirect
    const { data } = await supabase.auth.getUser();
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      toast.error("هذا الحساب ليس مدير النظام");
      navigate({ to: "/" });
      return;
    }
    toast.success("تم الدخول");
  };

  return (
    <main className="min-h-dvh grid place-items-center px-4 max-w-md mx-auto">
      <div className="w-full rounded-3xl glass-strong p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-2xl btn-primary grid place-items-center">
            <Lock className="size-6" />
          </div>
          <h2 className="text-xl font-extrabold">لوحة التحكم</h2>
          <p className="text-sm text-muted-foreground">
            {loggedIn ? "هذا الحساب ليس مديراً." : "تسجيل دخول المدير"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 outline-none focus:border-primary"
            required
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 outline-none focus:border-primary"
            required
            autoComplete="current-password"
          />
          <button
            disabled={busy}
            className="w-full h-12 rounded-xl btn-primary font-extrabold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}

function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });
}

function StatsCards() {
  const { data } = useOrders();
  const orders = data ?? [];
  const total = orders
    .filter((o) => o.status !== "ملغى")
    .reduce((s, o) => s + Number(o.total_price), 0);
  const pending = orders.filter((o) => o.status === "جديد").length;
  const completed = orders.filter((o) => o.status === "تم التسليم").length;
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard icon={<DollarSign className="size-4" />} label="المبيعات" value={formatDZD(total)} />
      <StatCard icon={<Package className="size-4" />} label="جديدة" value={String(pending)} accent />
      <StatCard
        icon={<ShoppingBag className="size-4" />}
        label="مكتملة"
        value={String(completed)}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 glass ${accent ? "ring-2 ring-accent/40" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-extrabold text-sm leading-tight">{value}</div>
    </div>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("الكل");
  const { data, isLoading } = useOrders();

  const filtered = useMemo(
    () => (filter === "الكل" ? data ?? [] : (data ?? []).filter((o) => o.status === filter)),
    [data, filter],
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };
  const del = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
        {(["الكل", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold transition ${
              filter === s ? "btn-primary" : "glass text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-10 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">لا توجد طلبات</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onStatus={updateStatus}
              onDelete={del}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onStatus,
  onDelete,
}: {
  order: Order;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const items = (order.cart_items ?? []) as CartItemLite[];
  const waNumber = order.phone.replace(/[^\d]/g, "").replace(/^0/, "213");
  const shipping = Number(order.shipping_fee ?? 0);
  const subtotal = Number(order.total_price) - shipping;
  return (
    <li className="rounded-2xl glass p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold">{order.customer_name}</div>
          <div className="text-xs text-muted-foreground" dir="ltr">
            {order.phone}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="text-xs text-muted-foreground">
        {order.wilaya} • {order.commune} • {order.delivery_type}
      </div>
      <ul className="text-xs space-y-0.5">
        {items.map((c, idx) => (
          <li key={idx} className="flex justify-between">
            <span className="line-clamp-1">
              {c.quantity}× {c.title}
            </span>
            <span className="font-medium">{formatDZD(c.price * c.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs space-y-0.5 pt-1 border-t border-white/10">
        <div className="flex justify-between text-muted-foreground">
          <span>المنتجات</span>
          <span>{formatDZD(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>التوصيل</span>
          <span>{formatDZD(shipping)}</span>
        </div>
        <div className="flex justify-between font-extrabold text-primary">
          <span>الإجمالي</span>
          <span>{formatDZD(order.total_price)}</span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {new Date(order.created_at).toLocaleString("ar-DZ")}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${order.phone}`}
          className="h-9 rounded-xl glass text-xs font-bold flex items-center justify-center gap-1"
        >
          <PhoneCall className="size-3.5" /> اتصال
        </a>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1"
        >
          <MessageCircle className="size-3.5" /> واتساب
        </a>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={order.status}
          onChange={(e) => onStatus(order.id, e.target.value)}
          className="flex-1 h-9 rounded-xl border border-white/10 bg-input px-2 text-sm font-medium"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => onDelete(order.id)}
          className="size-9 grid place-items-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    جديد: "bg-accent/20 text-accent",
    مؤكد: "bg-primary/20 text-primary",
    "قيد الشحن": "bg-warning/20 text-warning",
    "تم التسليم": "bg-success/20 text-success",
    ملغى: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const del = async (id: string) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        className="w-full h-12 rounded-xl btn-primary font-extrabold flex items-center justify-center gap-2"
      >
        <Plus className="size-5" /> إضافة منتج جديد
      </button>

      {isLoading ? (
        <div className="py-10 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">لا توجد منتجات</div>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((p) => (
            <li key={p.id} className="rounded-2xl glass p-2.5 flex gap-3">
              <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="size-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">{p.title}</h3>
                <div className="text-xs text-muted-foreground">
                  {p.category ?? "—"} • مخزون: {p.stock}
                </div>
                <div className="font-extrabold text-primary text-sm mt-0.5">
                  {formatDZD(p.price)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                  className="size-8 grid place-items-center rounded-lg glass"
                >
                  <Edit3 className="size-4" />
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="size-8 grid place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <ProductForm
          product={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["products"] });
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [oldPrice, setOldPrice] = useState(product?.old_price ? String(product.old_price) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "0");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      setUploading(false);
      toast.error("فشل الرفع: " + upErr.message);
      return;
    }
    const { data, error } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    setUploading(false);
    if (error || !data) return toast.error("تعذّر إنشاء الرابط");
    setImageUrl(data.signedUrl);
    toast.success("تم رفع الصورة");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return toast.error("العنوان والسعر مطلوبان");
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : null,
      category: category.trim() || null,
      stock: Number(stock) || 0,
      image_url: imageUrl || null,
    };
    const q = product
      ? supabase.from("products").update(payload).eq("id", product.id)
      : supabase.from("products").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(product ? "تم التحديث" : "تمت الإضافة");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-bold text-lg">{product ? "تعديل منتج" : "إضافة منتج"}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center size-9 rounded-full hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={save} className="p-4 space-y-3 overflow-y-auto">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">الصورة</span>
            <div className="flex items-center gap-3">
              <div className="size-20 rounded-xl bg-muted overflow-hidden grid place-items-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-6 text-muted-foreground" />
                )}
              </div>
              <label className="flex-1 h-11 rounded-xl border-2 border-dashed border-white/20 grid place-items-center text-sm text-muted-foreground cursor-pointer hover:bg-white/5">
                {uploading ? "جارٍ الرفع..." : "اختر صورة"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                  }}
                />
              </label>
            </div>
          </label>

          <Fld label="العنوان">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ainp"
              required
            />
          </Fld>
          <Fld label="الوصف">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="ainp min-h-[80px] py-2"
            />
          </Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="السعر (دج)">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                className="ainp"
                required
              />
            </Fld>
            <Fld label="السعر القديم">
              <input
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                type="number"
                min="0"
                className="ainp"
              />
            </Fld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="الفئة">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ainp"
              />
            </Fld>
            <Fld label="المخزون">
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                type="number"
                min="0"
                className="ainp"
              />
            </Fld>
          </div>

          <button
            disabled={saving || uploading}
            className="w-full h-12 rounded-xl btn-primary font-extrabold disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ..." : product ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
          <style>{`.ainp{width:100%;height:44px;border-radius:12px;border:1px solid var(--border);padding:0 14px;font-size:14px;background:var(--input);color:var(--foreground);outline:none}.ainp:focus{border-color:var(--primary)}`}</style>
        </form>
      </div>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
