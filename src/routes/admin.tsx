import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { formatDZD } from "@/lib/format";
import type { Order, Product } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { toast } from "sonner";
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
} from "lucide-react";

const PASSCODE_KEY = "admin_ok_v1";
const DEFAULT_PASSCODE = "123456";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — متجر الجزائر" },
      { name: "description", content: "إدارة المنتجات والطلبات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"orders" | "products">("orders");

  useEffect(() => {
    if (sessionStorage.getItem(PASSCODE_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) return <PasscodeGate onOk={() => setAuthed(true)} />;

  return (
    <>
      <AppHeader />
      <main className="px-3 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">لوحة التحكم</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem(PASSCODE_KEY);
              setAuthed(false);
            }}
            className="text-sm text-muted-foreground flex items-center gap-1"
          >
            <LogOut className="size-4" /> خروج
          </button>
        </div>

        <StatsCards />

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
            الطلبات
          </TabBtn>
          <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
            المنتجات
          </TabBtn>
        </div>

        {tab === "orders" ? <OrdersPanel /> : <ProductsPanel />}
      </main>
    </>
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
      className={`h-10 rounded-lg text-sm font-bold transition ${
        active ? "bg-card text-primary shadow" : "text-secondary-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function PasscodeGate({ onOk }: { onOk: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  return (
    <>
      <AppHeader />
      <main className="px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="text-center space-y-2">
            <div className="mx-auto size-14 rounded-2xl bg-primary/10 grid place-items-center">
              <Package className="size-7 text-primary" />
            </div>
            <h2 className="text-lg font-extrabold">لوحة التحكم</h2>
            <p className="text-sm text-muted-foreground">أدخل رمز المرور للدخول</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (val === DEFAULT_PASSCODE) {
                sessionStorage.setItem(PASSCODE_KEY, "1");
                onOk();
              } else {
                setErr(true);
                setTimeout(() => setErr(false), 800);
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              inputMode="numeric"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="••••••"
              className={`w-full h-12 text-center tracking-[0.5em] text-lg font-bold rounded-xl border-2 bg-input outline-none ${
                err ? "border-destructive animate-pulse" : "border-border focus:border-primary"
              }`}
              autoFocus
            />
            <button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold">
              دخول
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function StatsCards() {
  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
  const total = (data ?? []).reduce((s, o) => s + Number(o.total_price), 0);
  const count = data?.length ?? 0;
  const pending = (data ?? []).filter((o) => o.status === "جديد").length;
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard icon={<DollarSign className="size-4" />} label="الإيرادات" value={formatDZD(total)} />
      <StatCard icon={<ShoppingBag className="size-4" />} label="الطلبات" value={String(count)} />
      <StatCard
        icon={<Package className="size-4" />}
        label="جديدة"
        value={String(pending)}
        accent
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
      className={`rounded-2xl p-3 border ${
        accent ? "bg-accent/15 border-accent/40" : "bg-card border-border"
      }`}
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
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const filtered = useMemo(
    () => (filter === "الكل" ? data ?? [] : (data ?? []).filter((o) => o.status === filter)),
    [data, filter],
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث حالة الطلب");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };
  const del = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم حذف الطلب");
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
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
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
            <li key={o.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {o.phone}
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-xs text-muted-foreground">
                {o.wilaya} • {o.commune} • {o.delivery_type}
              </div>
              <ul className="text-xs space-y-0.5">
                {o.cart_items.map((c, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="line-clamp-1">
                      {c.quantity}× {c.title}
                    </span>
                    <span className="font-medium">{formatDZD(c.price * c.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="font-extrabold text-primary">{formatDZD(o.total_price)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ar-DZ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-border bg-input px-2 text-sm font-medium"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => del(o.id)}
                  className="size-9 grid place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "جديد": "bg-accent/20 text-accent-foreground",
    "مؤكد": "bg-primary/15 text-primary",
    "تم الشحن": "bg-warning/20 text-warning-foreground",
    "تم التسليم": "bg-success/15 text-success",
    "ملغى": "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${map[status] ?? "bg-muted"}`}>
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
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"
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
            <li
              key={p.id}
              className="rounded-2xl border border-border bg-card p-2.5 flex gap-3"
            >
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
                  className="size-8 grid place-items-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70"
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
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
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
    if (!title.trim() || !price) {
      toast.error("العنوان والسعر مطلوبان");
      return;
    }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-bold text-lg">{product ? "تعديل منتج" : "إضافة منتج"}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center size-9 rounded-full hover:bg-muted"
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
              <label className="flex-1 h-11 rounded-xl border-2 border-dashed border-border grid place-items-center text-sm text-muted-foreground cursor-pointer hover:bg-muted">
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="ainp" required />
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
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="ainp" />
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
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ..." : product ? "حفظ التعديلات" : "إضافة المنتج"}
          </button>
          <style>{`.ainp{width:100%;height:44px;border-radius:12px;border:1px solid var(--border);padding:0 14px;font-size:14px;background:var(--input);outline:none}.ainp:focus{border-color:var(--primary)}`}</style>
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
