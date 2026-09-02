import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import type { CartItemLite, Order, Product, StaffMember } from "@/lib/types";
import { ORDER_STATUSES, productImages } from "@/lib/types";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { printInvoice } from "@/lib/invoice";
import { customerWaLink } from "@/lib/whatsapp";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsMenu } from "@/components/SettingsMenu";
import { generateProductCopy, generateLandingPage } from "@/lib/ai.functions";
import { addStaff, removeStaff, setStaffStatus } from "@/lib/staff.functions";
import { emergencyAdminLogin } from "@/lib/account.functions";

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
  Printer,
  Ticket,
  ShoppingCart,
  Users,
  Settings,
  Sparkles,
  Wand2,
  Check,
  Ban,
  ExternalLink,
  Download,
  KeyRound,
  ArrowRight,
  Truck,
  UserCog,
} from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";
import { DeliveryRatesPanel } from "@/components/admin/DeliveryRatesPanel";
import { AccountPanel } from "@/components/admin/AccountPanel";
import { LandingEditor } from "@/components/admin/LandingEditor";


const ADMIN_EMAIL = "chaib.aziz2004@gmail.com";
const EMERGENCY_CODE = "652004";


type TabKey =
  | "orders"
  | "sales"
  | "products"
  | "coupons"
  | "abandoned"
  | "staff"
  | "settings"
  | "delivery"
  | "account";
type Role = "owner" | "admin" | "sub_admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — تسوق Tasawa9" },
      { name: "description", content: "إدارة المنتجات والطلبات والإعدادات." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const TABS: { key: TabKey; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
  { key: "orders", label: "الطلبات", icon: <ShoppingBag className="size-4" /> },
  { key: "sales", label: "المبيعات", icon: <DollarSign className="size-4" />, ownerOnly: true },
  { key: "products", label: "المنتجات", icon: <Package className="size-4" /> },
  { key: "coupons", label: "الأكواد", icon: <Ticket className="size-4" />, ownerOnly: true },
  { key: "abandoned", label: "متروكة", icon: <ShoppingCart className="size-4" />, ownerOnly: true },
  { key: "staff", label: "الموظفون", icon: <Users className="size-4" />, ownerOnly: true },
  { key: "delivery", label: "التوصيل", icon: <Truck className="size-4" />, ownerOnly: true },
  { key: "settings", label: "الإعدادات", icon: <Settings className="size-4" />, ownerOnly: true },
  { key: "account", label: "الحساب", icon: <UserCog className="size-4" /> },
];


function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabKey>("orders");

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

  const email = session?.user?.email?.toLowerCase() ?? null;
  const isOwner = email === ADMIN_EMAIL;
  const { data: roleRow, isLoading: roleLoading } = useQuery({
    queryKey: ["my-role", session?.user?.id],
    enabled: !!session?.user?.id && !isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role,status")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as { role: "admin" | "sub_admin"; status: string } | null;
    },
  });

  if (!ready || (session && !isOwner && roleLoading)) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const blocked = !isOwner && roleRow?.status === "blocked";
  const role: Role | null = isOwner ? "owner" : blocked ? null : roleRow?.role ?? null;
  if (!session || !role) return <AdminLogin loggedIn={!!session} blocked={blocked} />;

  const isStaffOnly = role === "sub_admin";
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || !isStaffOnly);
  const activeTab = visibleTabs.some((t) => t.key === tab) ? tab : "orders";


  return (
    <main className="min-h-dvh mx-auto max-w-md lg:max-w-6xl px-3 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">لوحة التحكم</h1>
          <div className="text-xs text-muted-foreground">
            {session.user.email} • {role === "sub_admin" ? "مساعد" : "مدير"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SettingsMenu
            adminMode={role !== "sub_admin"}
            onSetDefaultTheme={async (id) => {
              const { data: row } = await supabase.from("store_settings").select("id").limit(1).maybeSingle();
              if (row?.id) await supabase.from("store_settings").update({ default_theme: id }).eq("id", row.id);
              else await supabase.from("store_settings").insert({ default_theme: id });
            }}
          />
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("تم تسجيل الخروج");
            }}
            className="h-10 px-3 rounded-2xl glass text-sm font-bold flex items-center gap-1"
          >
            <LogOut className="size-4" /> خروج
          </button>
        </div>
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-5">
        <nav className="grid grid-cols-4 gap-1 rounded-2xl glass p-1 lg:sticky lg:top-4 lg:h-fit lg:grid-cols-1 lg:gap-1.5 lg:p-2">
          {visibleTabs.map((t) => (
            <TabBtn key={t.key} active={activeTab === t.key} onClick={() => setTab(t.key)}>
              <span className="hidden lg:inline-flex">{t.icon}</span>
              {t.label}
            </TabBtn>
          ))}
        </nav>

        <div className="mt-3 lg:mt-0">
          {activeTab === "orders" && <OrdersPanel />}
          {activeTab === "sales" && <SalesPanel />}
          {activeTab === "products" && <ProductsPanel role={role} />}
          {activeTab === "coupons" && <CouponsPanel />}
          {activeTab === "abandoned" && <AbandonedPanel />}
          {activeTab === "staff" && <StaffPanel />}
          {activeTab === "delivery" && <DeliveryRatesPanel />}
          {activeTab === "settings" && <SettingsPanel />}
          {activeTab === "account" && <AccountPanel />}
        </div>
      </div>
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
      className={`h-10 rounded-xl text-xs font-bold transition ${
        active ? "btn-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AdminLogin({ loggedIn, blocked }: { loggedIn: boolean; blocked?: boolean }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "verify" | "newpass">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetPass, setResetPass] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/public/setup-admin").catch(() => {});
  }, []);

  const credentials = (value: string, pass: string) => {
    const v = value.trim();
    const isEmail = v.includes("@");
    if (isEmail) return { email: v, password: pass };
    const digits = v.replace(/[^\d+]/g, "");
    const phone = digits.startsWith("+")
      ? digits
      : digits.startsWith("0")
        ? `+213${digits.slice(1)}`
        : `+${digits}`;
    return { phone, password: pass };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    // Emergency access: identifier AND password both exactly "652004".
    if (identifier.trim() === EMERGENCY_CODE && password === EMERGENCY_CODE) {
      try {
        const { tokenHash } = await emergencyAdminLogin({ data: { code: EMERGENCY_CODE } });
        const { error: vErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });
        if (vErr) throw new Error(vErr.message);
        try {
          sessionStorage.setItem("admin:tab", "settings");
        } catch {}
        toast.success("تم الدخول بوضع الطوارئ");
        setBusy(false);
        return;
      } catch (err) {
        setBusy(false);
        toast.error(err instanceof Error ? err.message : "تعذّر الدخول بوضع الطوارئ");
        return;
      }
    }

    const creds = credentials(identifier, password);
    let { error } = await supabase.auth.signInWithPassword(creds as never);

    if (error) {
      try {
        await fetch("/api/public/setup-admin");
      } catch {}
      const retry = await supabase.auth.signInWithPassword(creds as never);
      error = retry.error;
    }
    setBusy(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      const { data: row } = await supabase
        .from("user_roles")
        .select("role,status")
        .eq("user_id", uid!)
        .maybeSingle();
      if (!row || row.status === "blocked") {
        await supabase.auth.signOut();
        toast.error(row ? "تم سحب صلاحياتك من الإدارة" : "هذا الحساب لا يملك صلاحية الإدارة");
        navigate({ to: "/" });
        return;
      }
    }
    toast.success("تم الدخول");
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = resetEmail.trim();
    if (!email.includes("@")) return toast.error("أدخل بريداً إلكترونياً صحيحاً");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم إرسال رمز من 6 أرقام إلى بريدك");
    setMode("verify");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/[^\d]/g, "");
    if (code.length !== 6) return toast.error("الرمز يجب أن يكون 6 أرقام");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: resetEmail.trim(),
      token: code,
      type: "email",
    });
    setBusy(false);
    if (error) return toast.error("الرمز غير صحيح أو منتهي");
    toast.success("تم التحقق، أدخل كلمة المرور الجديدة");
    setMode("newpass");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPass.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: resetPass });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور وتسجيل دخولك");
    setOtp("");
    setResetPass("");
    setMode("login");
  };

  return (
    <main className="min-h-dvh grid place-items-center px-4 max-w-md mx-auto">
      <div className="w-full rounded-3xl glass-strong p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-2xl btn-primary grid place-items-center">
            {mode === "login" ? <Lock className="size-6" /> : <KeyRound className="size-6" />}
          </div>
          <h2 className="text-xl font-extrabold">لوحة التحكم</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "forgot"
              ? "أدخل بريدك لإرسال رمز التحقق"
              : mode === "verify"
                ? "أدخل رمز التحقق المكوّن من 6 أرقام"
                : mode === "newpass"
                  ? "اختر كلمة المرور الجديدة"
                  : blocked
                    ? "تم سحب صلاحيات هذا الحساب."
                    : loggedIn
                      ? "هذا الحساب لا يملك صلاحية الإدارة."
                      : "تسجيل الدخول"}
          </p>
        </div>

        {mode === "login" && (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="البريد الإلكتروني أو رقم الهاتف"
              className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 outline-none focus:border-primary"
              required
              autoComplete="username"
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
            <button
              type="button"
              onClick={() => {
                setResetEmail(identifier.includes("@") ? identifier.trim() : "");
                setMode("forgot");
              }}
              className="w-full text-center text-xs font-bold text-primary"
            >
              نسيت كلمة السر؟
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={sendOtp} className="space-y-3">
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="البريد الإلكتروني المسجّل"
              dir="ltr"
              className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 outline-none focus:border-primary"
              required
            />
            <button
              disabled={busy}
              className="w-full h-12 rounded-xl btn-primary font-extrabold disabled:opacity-60"
            >
              {busy ? "..." : "إرسال رمز التحقق"}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground"
            >
              <ArrowRight className="size-3" /> رجوع لتسجيل الدخول
            </button>
          </form>
        )}

        {mode === "verify" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="رمز التحقق (6 أرقام)"
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 text-center tracking-[0.4em] outline-none focus:border-primary"
              required
            />
            <button
              disabled={busy}
              className="w-full h-12 rounded-xl btn-primary font-extrabold disabled:opacity-60"
            >
              {busy ? "..." : "تحقّق من الرمز"}
            </button>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground"
            >
              <ArrowRight className="size-3" /> إعادة إرسال الرمز
            </button>
          </form>
        )}

        {mode === "newpass" && (
          <form onSubmit={savePassword} className="space-y-3">
            <input
              type="password"
              value={resetPass}
              onChange={(e) => setResetPass(e.target.value)}
              placeholder="كلمة مرور جديدة"
              dir="ltr"
              className="w-full h-12 rounded-xl bg-input border border-white/10 px-4 outline-none focus:border-primary"
              required
            />
            <button
              disabled={busy}
              className="w-full h-12 rounded-xl btn-primary font-extrabold disabled:opacity-60"
            >
              {busy ? "..." : "حفظ وتسجيل الدخول"}
            </button>
          </form>
        )}

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

/** Statuses that count as an admin-approved (confirmed) sale. */
const APPROVED_STATUSES = ["مؤكد", "قيد الشحن", "تم التسليم"] as const;

/** Sales analytics: approved orders only, with week / month / custom filters. */
function SalesPanel() {
  const { data, isLoading } = useOrders();
  const [range, setRange] = useState<"week" | "month" | "custom">("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const approved = useMemo(() => {
    const list = (data ?? []).filter((o) =>
      (APPROVED_STATUSES as readonly string[]).includes(o.status),
    );
    const now = new Date();
    return list.filter((o) => {
      const t = new Date(o.created_at).getTime();
      if (range === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        start.setHours(0, 0, 0, 0);
        return t >= start.getTime();
      }
      if (range === "month") {
        return t >= new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      }
      if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
      if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [data, range, from, to]);

  const revenue = approved.reduce((s, o) => s + Number(o.total_price), 0);
  const delivered = approved.filter((o) => o.status === "تم التسليم").length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl glass p-3 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["week", "هذا الأسبوع"],
              ["month", "هذا الشهر"],
              ["custom", "تحديد فترة"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={`h-8 px-3 rounded-full text-xs font-bold transition ${
                range === k ? "btn-primary" : "glass text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground">من تاريخ</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-input px-2 text-xs outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground">إلى تاريخ</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-input px-2 text-xs outline-none focus:border-primary"
              />
            </label>
          </div>
        )}
        <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">
          تُحسب المبيعات من الطلبات المقبولة من الإدارة فقط.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<DollarSign className="size-4" />}
          label="إجمالي المبيعات"
          value={formatDZD(revenue)}
          accent
        />
        <StatCard
          icon={<ShoppingBag className="size-4" />}
          label="طلبات مقبولة"
          value={String(approved.length)}
        />
        <StatCard icon={<Package className="size-4" />} label="تم التسليم" value={String(delivered)} />
      </div>

      <div className="rounded-2xl glass divide-y divide-border">
        {isLoading && <div className="p-3 text-xs text-muted-foreground">جارٍ التحميل…</div>}
        {!isLoading && approved.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">لا مبيعات في هذه الفترة</div>
        )}
        {approved.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-2 p-3 text-xs">
            <div className="min-w-0">
              <div className="truncate font-bold">{o.customer_name}</div>
              <div className="text-muted-foreground">
                {o.wilaya} • {new Date(o.created_at).toLocaleDateString("ar-DZ")}
              </div>
            </div>
            <div className="shrink-0 font-extrabold text-primary">
              {formatDZD(Number(o.total_price))}
            </div>
          </div>
        ))}
      </div>
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

type RangeKey = "all" | "month" | "custom";

function OrdersPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("الكل");
  const [range, setRange] = useState<RangeKey>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useOrders();

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    if (range === "month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return t >= start;
    }
    if (range === "custom") {
      if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
      if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
    }
    return true;
  };

  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter((o) => inRange(o.created_at))
        .filter((o) => filter === "الكل" || o.status === filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filter, range, from, to],
  );

  const rangeRevenue = useMemo(
    () =>
      filtered
        .filter((o) => o.status !== "ملغى" && o.status !== "مرفوض")
        .reduce((s, o) => s + Number(o.total_price), 0),
    [filtered],
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم التحديث");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  /** Accepting an order confirms it AND publishes the real social-proof event. */
  const accept = async (o: Order) => {
    const { error } = await supabase.from("orders").update({ status: "مؤكد" }).eq("id", o.id);
    if (error) return toast.error(error.message);
    const items = (o.cart_items ?? []) as CartItemLite[];
    const title = items[0]?.title;
    if (title) {
      const { error: evErr } = await supabase.from("purchase_events").insert({
        first_name: o.customer_name.trim().split(/\s+/)[0] ?? o.customer_name,
        wilaya: o.wilaya,
        product_title: title,
      });
      if (evErr) toast.error("تم القبول لكن تعذّر نشر الإشعار");
    }
    toast.success("تم قبول الطلب");
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["purchase-events"] });
  };

  const refuse = async (o: Order, reason: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "مرفوض", refusal_reason: reason })
      .eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("تم رفض الطلب");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const del = async (id: string) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["orders"] });
  };


  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = filtered.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  const cardProps = {
    onStatus: updateStatus,
    onDelete: del,
    onAccept: accept,
    onRefuse: refuse,
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
        <>
          {/* Mobile: stacked full cards */}
          <ul className="space-y-2 lg:hidden">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} {...cardProps} />
            ))}
          </ul>

          {/* Desktop: split view — list on the left, details + label preview on the right */}
          <div className="hidden lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-4 lg:items-start">
            <ul className="max-h-[75vh] space-y-1.5 overflow-y-auto pl-1">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full rounded-2xl p-2.5 text-right transition ${
                      selected?.id === o.id ? "glass-strong ring-2 ring-primary" : "glass"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold">{o.customer_name}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{o.wilaya}</span>
                      <span className="font-extrabold text-primary">
                        {formatDZD(o.total_price)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {selected && (
              <div className="grid gap-4 xl:grid-cols-2">
                <ul>
                  <OrderCard key={selected.id} order={selected} {...cardProps} />
                </ul>
                <ShippingLabelPreview order={selected} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Bordereau preview formatted for Algerian couriers (Yalidine / ZR Express). */
function ShippingLabelPreview({ order }: { order: Order }) {
  return (
    <div className="rounded-2xl glass p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-muted-foreground">معاينة ملصق الشحن</div>
        <button
          onClick={() => printInvoice(order)}
          className="h-8 px-3 rounded-xl bg-primary/15 text-primary text-xs font-extrabold flex items-center gap-1"
        >
          <Printer className="size-3.5" /> طباعة
        </button>
      </div>
      <div className="rounded-xl bg-white p-3 text-black text-[11px] space-y-2">
        <div className="flex items-center justify-between border-b border-black/20 pb-1.5">
          <span className="font-black">تسوق | Tasawa9</span>
          <span dir="ltr">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="space-y-0.5">
          <div className="font-bold">{order.customer_name}</div>
          <div dir="ltr">{order.phone}</div>
          <div>
            {order.wilaya} — {order.commune}
          </div>
          <div>{order.delivery_type}</div>
        </div>
        <div className="flex justify-between border-t border-black/20 pt-1.5">
          <span>رسوم التوصيل</span>
          <span>{formatDZD(order.shipping_fee ?? 0)}</span>
        </div>
        <div className="flex justify-between border-t border-black/20 pt-1.5 text-sm font-black">
          <span>الدفع عند الاستلام</span>
          <span>{formatDZD(order.total_price)}</span>
        </div>
      </div>
    </div>
  );
}


function OrderCard({
  order,
  onStatus,
  onDelete,
  onAccept,
  onRefuse,
}: {
  order: Order;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onAccept: (o: Order) => unknown;
  onRefuse: (o: Order, reason: string) => unknown;

}) {
  const items = (order.cart_items ?? []) as CartItemLite[];
  const waNumber = order.phone.replace(/[^\d]/g, "").replace(/^0/, "213");
  const shipping = Number(order.shipping_fee ?? 0);
  const subtotal = Number(order.total_price) - shipping;
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");

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
      {order.refusal_reason && (
        <div className="rounded-xl bg-destructive/10 px-2.5 py-1.5 text-[11px] font-semibold text-destructive">
          سبب الرفض: {order.refusal_reason}
        </div>
      )}

      {order.status === "جديد" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAccept(order)}
            className="h-9 rounded-xl bg-success/20 text-success text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <Check className="size-3.5" /> قبول الطلب
          </button>
          <button
            onClick={() => setRefusing(true)}
            className="h-9 rounded-xl bg-destructive/15 text-destructive text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <Ban className="size-3.5" /> رفض الطلب
          </button>
        </div>
      )}

      {refusing && (
        <div className="space-y-2 rounded-xl glass p-2.5">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="سبب الرفض (إلزامي)"
            className="w-full rounded-lg border border-border bg-input p-2 text-xs outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (!reason.trim()) return toast.error("سبب الرفض إلزامي");
                onRefuse(order, reason.trim());
                setRefusing(false);
                setReason("");
              }}
              className="h-8 rounded-lg bg-destructive text-destructive-foreground text-xs font-extrabold"
            >
              تأكيد الرفض
            </button>
            <button
              onClick={() => setRefusing(false)}
              className="h-8 rounded-lg glass text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}


      <div className="grid grid-cols-3 gap-2">
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
        <button
          onClick={() => printInvoice(order)}
          className="h-9 rounded-xl bg-primary/15 text-primary text-xs font-bold flex items-center justify-center gap-1"
        >
          <Printer className="size-3.5" /> طباعة
        </button>
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

function ProductsPanel({ role }: { role: Role }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [landingBusy, setLandingBusy] = useState<string | null>(null);
  const [landingEdit, setLandingEdit] = useState<Product | null>(null);
  const makeLanding = useServerFn(generateLandingPage);
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

  const buildLanding = async (p: Product) => {
    setLandingBusy(p.id);
    try {
      const res = await makeLanding({ data: { productId: p.id } });
      toast.success("تم إنشاء صفحة الهبوط");
      qc.invalidateQueries({ queryKey: ["products"] });
      window.open(`/p/${res.slug}`, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الإنشاء");
    } finally {
      setLandingBusy(null);
    }
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
        <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {(data ?? []).map((p) => {
            const thumb = productImages(p)[0];
            return (
              <li key={p.id} className="rounded-2xl glass p-2.5 space-y-2">
                <div className="flex gap-3">
                  <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={p.title} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{p.title}</h3>
                    <div className="text-xs text-muted-foreground">
                      {p.category ?? "—"} • مخزون: {p.stock}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-extrabold text-primary text-sm">
                        {formatDZD(p.price)}
                      </span>
                      {p.stock <= 0 && (
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
                          مخفي — نفد المخزون
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="size-8 grid place-items-center rounded-lg glass"
                      aria-label="تعديل"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      className="size-8 grid place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                      aria-label="حذف"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {role !== "sub_admin" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => buildLanding(p)}
                      disabled={landingBusy === p.id}
                      className="h-8 rounded-lg bg-primary/15 text-primary text-[11px] font-extrabold flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      {landingBusy === p.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="size-3.5" />
                      )}
                      صفحة هبوط AI
                    </button>
                    {p.landing_slug ? (
                      <button
                        onClick={() => setLandingEdit(p)}
                        className="h-8 rounded-lg glass text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <Edit3 className="size-3.5" /> تعديل / تنزيل الصفحة
                      </button>
                    ) : (
                      <span className="h-8 rounded-lg glass text-[11px] text-muted-foreground flex items-center justify-center">
                        لا توجد صفحة
                      </span>
                    )}
                    {p.landing_slug && (
                      <a
                        href={`/p/${p.landing_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 rounded-lg glass text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="size-3.5" /> عرض الصفحة
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}


      {landingEdit && (
        <LandingEditor
          product={landingEdit}
          open={!!landingEdit}
          onClose={() => setLandingEdit(null)}
        />
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

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
};

function CouponsPanel() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return toast.error("الرمز والقيمة مطلوبان");
    setBusy(true);
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: Number(value),
      min_order: Number(minOrder) || 0,
      active: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setCode("");
    setValue("");
    setMinOrder("");
    toast.success("تم إنشاء الرمز");
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  const toggle = async (c: Coupon) => {
    const { error } = await supabase
      .from("coupons")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  const del = async (id: string) => {
    if (!confirm("حذف هذا الرمز؟")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["coupons"] });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 font-extrabold text-sm">
          <Ticket className="size-4 text-primary" /> إنشاء رمز جديد
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="الرمز (مثال: WELCOME10)"
          className="ainp uppercase"
          maxLength={30}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className="ainp"
          >
            <option value="percent">نسبة %</option>
            <option value="fixed">قيمة ثابتة</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            min="0"
            placeholder={type === "percent" ? "10" : "500"}
            className="ainp"
            required
          />
        </div>
        <input
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          type="number"
          min="0"
          placeholder="الحد الأدنى للطلب (اختياري)"
          className="ainp"
        />
        <button
          disabled={busy}
          className="w-full h-10 rounded-xl btn-primary font-extrabold text-sm disabled:opacity-60"
        >
          {busy ? "..." : "إضافة الرمز"}
        </button>
        <style>{`.ainp{width:100%;height:40px;border-radius:12px;border:1px solid var(--border);padding:0 12px;font-size:14px;background:var(--input);color:var(--foreground);outline:none}.ainp:focus{border-color:var(--primary)}`}</style>
      </form>

      {isLoading ? (
        <div className="py-6 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">لا توجد أكواد</div>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((c) => (
            <li key={c.id} className="rounded-2xl glass p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-lg tracking-wide">{c.code}</div>
                <StatusBadge status={c.active ? "مؤكد" : "ملغى"} />
              </div>
              <div className="text-xs text-muted-foreground">
                {c.discount_type === "percent"
                  ? `خصم ${c.discount_value}%`
                  : `خصم ${formatDZD(c.discount_value)}`}
                {Number(c.min_order) > 0 && ` • حد أدنى ${formatDZD(c.min_order)}`}
                {" • "}استُعمل {c.times_used}×
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggle(c)}
                  className="flex-1 h-8 rounded-lg glass text-xs font-bold"
                >
                  {c.active ? "تعطيل" : "تفعيل"}
                </button>
                <button
                  onClick={() => del(c.id)}
                  className="size-8 grid place-items-center rounded-lg bg-destructive/10 text-destructive"
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

type AbandonedCart = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  wilaya: string | null;
  commune: string | null;
  cart_items: CartItemLite[];
  subtotal: number;
  created_at: string;
  updated_at: string;
};

function AbandonedPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["abandoned_carts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AbandonedCart[];
    },
  });

  const del = async (id: string) => {
    if (!confirm("حذف هذه السلة؟")) return;
    const { error } = await supabase.from("abandoned_carts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["abandoned_carts"] });
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="py-6 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          <ShoppingCart className="mx-auto size-10 opacity-40 mb-2" />
          لا توجد سلات متروكة
        </div>
      ) : (
        (data ?? []).map((c) => {
          const items = (c.cart_items ?? []) as CartItemLite[];
          const waMsg = `مرحباً ${c.customer_name ?? ""}، لاحظنا اهتمامك بمنتجاتنا في متجر الجزائر. هل تحتاج مساعدة لإتمام طلبك؟`;
          return (
            <div key={c.id} className="rounded-2xl glass p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{c.customer_name ?? "— بدون اسم —"}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {c.phone ?? "—"}
                  </div>
                </div>
                <span className="text-xs font-extrabold text-primary">
                  {formatDZD(c.subtotal)}
                </span>
              </div>
              {(c.wilaya || c.commune) && (
                <div className="text-xs text-muted-foreground">
                  {[c.wilaya, c.commune].filter(Boolean).join(" • ")}
                </div>
              )}
              <ul className="text-xs space-y-0.5">
                {items.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="line-clamp-1">
                      {i.quantity}× {i.title}
                    </span>
                    <span>{formatDZD(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="text-[10px] text-muted-foreground">
                آخر نشاط: {new Date(c.updated_at).toLocaleString("ar-DZ")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {c.phone ? (
                  <>
                    <a
                      href={`tel:${c.phone}`}
                      className="h-9 rounded-xl glass text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <PhoneCall className="size-3.5" /> اتصال
                    </a>
                    <a
                      href={customerWaLink(c.phone, waMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="size-3.5" /> واتساب
                    </a>
                  </>
                ) : (
                  <div className="col-span-2 h-9 rounded-xl glass text-xs text-muted-foreground flex items-center justify-center">
                    لا يوجد هاتف
                  </div>
                )}
                <button
                  onClick={() => del(c.id)}
                  className="h-9 rounded-xl bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Trash2 className="size-3.5" /> حذف
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [freeShipping, setFreeShipping] = useState(!!product?.free_shipping);
  const [images, setImages] = useState<string[]>(product ? productImages(product) : []);
  const [videoUrl, setVideoUrl] = useState(product?.video_url ?? "");
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [offerAt, setOfferAt] = useState(toLocalInput(product?.offer_expires_at ?? null));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const writeCopy = useServerFn(generateProductCopy);

  const upload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        toast.error("فشل الرفع: " + upErr.message);
        continue;
      }
      const { data } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }
    setUploading(false);
    if (urls.length) {
      setImages((prev) => [...prev, ...urls]);
      toast.success(`تم رفع ${urls.length} صورة`);
    }
  };

  const runAi = async () => {
    if (!title.trim()) return toast.error("اكتب عنوان المنتج أولاً");
    setAiBusy(true);
    try {
      const res = await writeCopy({
        data: {
          title: title.trim(),
          category: category.trim() || null,
          price: price ? Number(price) : null,
        },
      });
      if (res.description) setDescription(res.description);
      if (res.tags.length) setTags(res.tags);
      if (!category.trim() && res.category) setCategory(res.category);
      toast.success("تم توليد الوصف والوسوم");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التوليد");
    } finally {
      setAiBusy(false);
    }
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
      free_shipping: freeShipping,
      image_url: images[0] ?? null,
      images: images.slice(1),
      video_url: videoUrl.trim() || null,
      tags,
      offer_expires_at: offerAt ? new Date(offerAt).toISOString() : null,
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-bold text-lg">{product ? "تعديل منتج" : "إضافة منتج"}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center size-9 rounded-full hover:bg-primary/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={save} className="p-4 space-y-3 overflow-y-auto">
          <div className="space-y-2">
            <span className="text-sm font-semibold">الصور (يمكن اختيار عدة صور)</span>
            <div className="flex flex-wrap gap-2">
              {images.map((src, idx) => (
                <div key={src} className="relative size-20 overflow-hidden rounded-xl bg-muted">
                  <img src={src} alt="" className="size-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[9px] font-bold text-white">
                      رئيسية
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((s) => s !== src))}
                    className="absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                    aria-label="حذف الصورة"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <label className="grid size-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:bg-primary/5">
                {uploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files;
                    if (f && f.length) upload(f);
                  }}
                />
              </label>
            </div>
          </div>

          <Fld label="العنوان">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ainp"
              required
            />
          </Fld>

          <button
            type="button"
            onClick={runAi}
            disabled={aiBusy}
            className="w-full h-10 rounded-xl bg-primary/15 text-primary text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            توليد وصف بالذكاء الاصطناعي
          </button>

          <Fld label="الوصف">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="ainp min-h-[100px] py-2"
            />
          </Fld>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  className="rounded-full glass px-2.5 py-1 text-[11px] font-bold"
                >
                  {t} ✕
                </button>
              ))}
            </div>
          )}

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

          <Fld label="رابط فيديو ترويجي (YouTube / Shorts)">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/shorts/..."
              className="ainp"
              dir="ltr"
            />
          </Fld>

          <Fld label="وقت انتهاء العرض (اختياري — يظهر العدّاد فقط إذا حُدّد)">
            <input
              value={offerAt}
              onChange={(e) => setOfferAt(e.target.value)}
              type="datetime-local"
              className="ainp"
            />
          </Fld>

          <button
            type="button"
            onClick={() => setFreeShipping((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-input px-3 py-2.5"
          >
            <span className="text-sm font-bold">توصيل مجاني</span>
            <span
              className={`relative h-6 w-11 rounded-full transition ${freeShipping ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${freeShipping ? "left-0.5" : "left-5"}`}
              />
            </span>
          </button>

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

function StaffPanel() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"sub_admin" | "admin">("sub_admin");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(addStaff);
  const drop = useServerFn(removeStaff);
  const setStatus = useServerFn(setStaffStatus);


  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StaffMember[];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: { identifier: email.trim(), password, fullName: fullName.trim(), role } });
      toast.success("تم إضافة الموظف");
      setEmail("");
      setFullName("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الإضافة");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الموظف نهائياً؟")) return;
    try {
      await drop({ data: { id } });
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الحذف");
    }
  };

  const toggleBlock = async (s: StaffMember) => {
    const next = s.status === "blocked" ? "active" : "blocked";
    if (next === "blocked" && !confirm("سحب صلاحيات هذا الموظف وإنهاء جلسته؟")) return;
    try {
      await setStatus({ data: { id: s.id, status: next } });
      toast.success(next === "blocked" ? "تم حظر الموظف" : "تمت إعادة الصلاحيات");
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر التنفيذ");
    }
  };



  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Users className="size-4 text-primary" /> إضافة موظف / مساعد
        </div>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          type="text"
          placeholder="الاسم الكامل"
          className="sinp"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          placeholder="البريد الإلكتروني أو رقم الهاتف"
          className="sinp"
          dir="ltr"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="text"
          placeholder="كلمة المرور (6 أحرف على الأقل)"
          className="sinp"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "sub_admin" | "admin")}
          className="sinp"
        >
          <option value="sub_admin">مساعد (الطلبات والمنتجات فقط)</option>
          <option value="admin">مدير (كل الصلاحيات)</option>
        </select>
        <button
          disabled={busy}
          className="w-full h-10 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          {busy ? "..." : "إضافة"}
        </button>
        <style>{`.sinp{width:100%;height:42px;border-radius:12px;border:1px solid var(--border);padding:0 12px;font-size:14px;background:var(--input);color:var(--foreground);outline:none}.sinp:focus{border-color:var(--primary)}`}</style>
      </form>

      {isLoading ? (
        <div className="py-6 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">لا يوجد موظفون</div>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-2xl glass p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{s.full_name || "بدون اسم"}</div>
                <div className="truncate text-[11px] text-muted-foreground" dir="ltr">
                  {s.email}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground">
                    {s.role === "admin" ? "مدير" : "مساعد"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-extrabold ${
                      s.status === "blocked"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {s.status === "blocked" ? "محظور" : "نشط"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleBlock(s)}
                className={`h-9 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1 ${
                  s.status === "blocked" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
                }`}
              >
                <Ban className="size-3.5" />
                {s.status === "blocked" ? "إعادة الصلاحيات" : "حظر / سحب الصلاحيات"}
              </button>
              <button
                onClick={() => remove(s.id)}
                className="size-9 grid place-items-center rounded-xl bg-destructive/10 text-destructive"
                aria-label="حذف الموظف"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

function SettingsPanel() {
  const qc = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [kb, setKb] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [iconBusy, setIconBusy] = useState(false);
  const pwa = usePwaInstall();
  const [iosGuide, setIosGuide] = useState(false);

  const installApp = async () => {
    if (pwa.installed) return toast.info("التطبيق مثبّت بالفعل");
    if (pwa.platform === "ios") return setIosGuide(true);
    if (pwa.canPrompt) {
      const r = await pwa.install();
      if (r === "accepted") toast.success("تم تثبيت التطبيق");
      return;
    }
    toast.info("افتح قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق»");
  };

  const uploadIcon = async (file: File) => {
    setIconBusy(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `app-icon-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (!upErr) {
      const { data: signed } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signed?.signedUrl) setIconUrl(signed.signedUrl);
      toast.success("تم رفع الأيقونة، اضغط حفظ الإعدادات");
    } else {
      toast.error("فشل الرفع: " + upErr.message);
    }
    setIconBusy(false);
  };

  const { data } = useQuery({
    queryKey: ["store-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data && !loaded) {
      setStoreName(String(data.store_name ?? ""));
      setWhatsapp(String(data.whatsapp_number ?? ""));
      setKb(String(data.chatbot_kb ?? ""));
      setIconUrl(String((data as { app_icon_url?: string | null }).app_icon_url ?? ""));
      setLoaded(true);
    }
  }, [data, loaded]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      store_name: storeName.trim() || "تسوق | Tasawa9",
      whatsapp_number: whatsapp.replace(/[^\d]/g, "") || "213782524124",
      chatbot_kb: kb,
      app_icon_url: iconUrl.trim() || null,
    };
    const { error } = data?.id
      ? await supabase.from("store_settings").update(payload).eq("id", data.id)
      : await supabase.from("store_settings").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
    qc.invalidateQueries({ queryKey: ["store-settings"] });
    qc.invalidateQueries({ queryKey: ["store-settings-admin"] });
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { email?: string; password?: string } = {};
    if (newEmail.trim()) payload.email = newEmail.trim();
    if (newPass) payload.password = newPass;
    if (!payload.email && !payload.password) return toast.error("أدخل بريداً أو كلمة مرور جديدة");
    const { error } = await supabase.auth.updateUser(payload);
    if (error) return toast.error(error.message);
    setNewEmail("");
    setNewPass("");
    toast.success("تم تحديث بيانات الحساب");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={save} className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Settings className="size-4 text-primary" /> إعدادات المتجر
        </div>
        <Fld label="اسم التطبيق / المتجر">
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="sinp" />
        </Fld>
        <Fld label="صورة / أيقونة التطبيق">
          <div className="flex items-center gap-2">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt="أيقونة التطبيق"
                className="size-12 shrink-0 rounded-2xl object-cover ring-1 ring-primary/40"
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl glass text-[10px] text-muted-foreground">
                بدون
              </span>
            )}
            <input
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="sinp min-w-0 flex-1"
            />
          </div>
          <label className="mt-2 flex h-10 cursor-pointer items-center justify-center rounded-xl glass text-xs font-extrabold">
            {iconBusy ? "جاري الرفع..." : "رفع صورة من الجهاز"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadIcon(f);
              }}
            />
          </label>
        </Fld>
        <Fld label="رقم واتساب الدعم">
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="sinp"
            dir="ltr"
            placeholder="213782524124"
          />
        </Fld>
        <Fld label="معلومات المساعد الذكي (يستعملها الشات بوت)">
          <textarea
            value={kb}
            onChange={(e) => setKb(e.target.value)}
            rows={5}
            className="sinp min-h-[110px] py-2"
          />
        </Fld>
        <button
          disabled={busy}
          className="w-full h-11 rounded-xl btn-primary font-extrabold disabled:opacity-60"
        >
          {busy ? "..." : "حفظ الإعدادات"}
        </button>
      </form>

      <form onSubmit={saveAccount} className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Lock className="size-4 text-primary" /> حساب المدير
        </div>
        <Fld label="بريد إلكتروني جديد">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            type="email"
            className="sinp"
            dir="ltr"
          />
        </Fld>
        <Fld label="كلمة مرور جديدة">
          <input
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            type="password"
            className="sinp"
            dir="ltr"
          />
        </Fld>
        <button className="w-full h-11 rounded-xl glass font-extrabold">تحديث الحساب</button>
        <style>{`.sinp{width:100%;height:42px;border-radius:12px;border:1px solid var(--border);padding:0 12px;font-size:14px;background:var(--input);color:var(--foreground);outline:none}.sinp:focus{border-color:var(--primary)}`}</style>
      </form>

      <div className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Download className="size-4 text-primary" /> تطبيق الإدارة
        </div>
        <p className="text-xs text-muted-foreground">
          ثبّت لوحة التحكم كتطبيق على الهاتف أو الكمبيوتر للوصول السريع.
        </p>
        <button
          type="button"
          onClick={installApp}
          className="w-full h-11 rounded-xl btn-primary font-extrabold"
        >
          {pwa.installed ? "التطبيق مثبّت" : "تثبيت التطبيق"}
        </button>
      </div>

      {iosGuide && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIosGuide(false)} />
          <div className="relative w-full max-w-sm rounded-3xl glass-strong p-5 space-y-3">
            <h3 className="font-extrabold">إضافة التطبيق على آيفون</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. اضغط زر المشاركة في شريط سفاري السفلي</li>
              <li>2. اختر «الإضافة إلى الشاشة الرئيسية»</li>
              <li>3. اضغط «إضافة»</li>
            </ol>
            <button
              onClick={() => setIosGuide(false)}
              className="h-11 w-full rounded-2xl btn-primary font-extrabold"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
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
