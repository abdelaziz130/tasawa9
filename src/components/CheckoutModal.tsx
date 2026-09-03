import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Modal } from "./Modal";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import type { WilayaShipping } from "@/lib/types";
import { toast } from "sonner";
import { Home, Building2, Loader2, Truck, Tag, CheckCircle2, XCircle } from "lucide-react";
import { estimateDelivery } from "@/lib/wilaya-eta";
import { COMMUNES } from "@/lib/communes";
import { trackAbandonedCart, clearAbandonedCart } from "@/lib/abandoned-cart";
import { validateCoupon, redeemCoupon, type PublicCoupon } from "@/lib/storefront.functions";

type DeliveryType = "توصيل للمنزل" | "توصيل لمكتب الشحن";

type Coupon = PublicCoupon;

export function CheckoutModal({
  open,
  onClose,
  productSubtotal,
}: {
  open: boolean;
  onClose: () => void;
  productSubtotal?: number;
}) {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const subtotal = productSubtotal ?? total;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState<string>("");
  const [commune, setCommune] = useState("");
  const [delivery, setDelivery] = useState<DeliveryType>("توصيل للمنزل");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const { data: wilayas } = useQuery({
    queryKey: ["wilayas_shipping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wilayas_shipping")
        .select("*")
        .order("wilaya_code");
      if (error) throw error;
      return (data ?? []) as WilayaShipping[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: communeRates } = useQuery({
    queryKey: ["communes_shipping", wilayaCode],
    enabled: !!wilayaCode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communes_shipping")
        .select("commune_name,home_fee,desk_fee")
        .eq("wilaya_code", Number(wilayaCode));
      if (error) throw error;
      return (data ?? []) as { commune_name: string; home_fee: number; desk_fee: number }[];
    },
    staleTime: 30 * 60 * 1000,
  });

  const selectedWilaya = useMemo(
    () => wilayas?.find((w) => String(w.wilaya_code) === wilayaCode) ?? null,
    [wilayas, wilayaCode],
  );

  const communeRate = useMemo(
    () => communeRates?.find((c) => c.commune_name === commune) ?? null,
    [communeRates, commune],
  );

  /** every product in the cart marked "free shipping" ⇒ delivery is free */
  const freeShipping = items.length > 0 && items.every((i) => i.free_shipping);

  const shippingFee =
    !selectedWilaya || freeShipping
      ? 0
      : delivery === "توصيل للمنزل"
        ? Number(communeRate?.home_fee ?? selectedWilaya.home_fee)
        : Number(communeRate?.desk_fee ?? selectedWilaya.desk_fee);

  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (Number(subtotal) < Number(coupon.min_order)) return 0;
    if (coupon.discount_type === "percent") {
      return Math.round((Number(subtotal) * Number(coupon.discount_value)) / 100);
    }
    return Math.min(Number(coupon.discount_value), Number(subtotal));
  }, [coupon, subtotal]);

  const grandTotal = Math.max(0, Number(subtotal) - discount) + shippingFee;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCheckingCoupon(true);
    let res: Awaited<ReturnType<typeof validateCoupon>> | null = null;
    try {
      res = await validateCoupon({ data: { code, subtotal: Number(subtotal) } });
    } catch {
      res = null;
    }
    setCheckingCoupon(false);
    if (!res || !res.ok) {
      setCoupon(null);
      if (res?.reason === "expired") return toast.error("انتهت صلاحية الرمز");
      if (res?.reason === "exhausted") return toast.error("تم استنفاد الرمز");
      if (res?.reason === "min_order")
        return toast.error(`الحد الأدنى للطلب: ${formatDZD(res.min_order ?? 0)}`);
      return toast.error("رمز غير صحيح");
    }
    setCoupon(res.coupon);
    toast.success("تم تطبيق التخفيض");
  };

  const saveDraft = () => {
    if (!items.length) return;
    trackAbandonedCart({
      customer_name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      wilaya: selectedWilaya
        ? `${String(selectedWilaya.wilaya_code).padStart(2, "0")} - ${selectedWilaya.wilaya_name}`
        : undefined,
      commune: commune.trim() || undefined,
      cart_items: items.map((i) => ({
        id: i.id,
        title: i.title,
        price: Number(i.price),
        quantity: i.quantity,
      })),
      subtotal: Number(subtotal),
    }).catch(() => {});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return toast.error("السلة فارغة");
    if (!name.trim() || !phone.trim() || !selectedWilaya || !commune.trim())
      return toast.error("يرجى ملء جميع الحقول");

    setSubmitting(true);
    const wilayaLabel = `${String(selectedWilaya.wilaya_code).padStart(2, "0")} - ${selectedWilaya.wilaya_name}`;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: name.trim(),
        phone: phone.trim(),
        wilaya: wilayaLabel,
        commune: commune.trim(),
        delivery_type: delivery,
        shipping_fee: shippingFee,
        cart_items: items.map((i) => ({
          id: i.id,
          title: i.title,
          price: Number(i.price),
          quantity: i.quantity,
        })),
        total_price: grandTotal,
        status: "جديد",
      })
      .select("id")
      .single();
    if (!error && coupon) {
      await supabase
        .from("coupons")
        .update({ times_used: coupon.times_used + 1 })
        .eq("id", coupon.id);
    }
    setSubmitting(false);
    if (error || !data) {
      toast.error("فشل إرسال الطلب: " + (error?.message ?? ""));
      return;
    }

    const snapshot = {
      id: data.id,
      customer_name: name.trim(),
      phone: phone.trim(),
      wilaya: wilayaLabel,
      commune: commune.trim(),
      delivery_type: delivery,
      shipping_fee: shippingFee,
      subtotal: Number(subtotal),
      discount,
      coupon_code: coupon?.code ?? null,
      total: grandTotal,
      items: items.map((i) => ({
        title: i.title,
        price: Number(i.price),
        quantity: i.quantity,
      })),
    };
    try {
      sessionStorage.setItem("last_order", JSON.stringify(snapshot));
    } catch {}

    clearAbandonedCart();
    clear();
    setName("");
    setPhone("");
    setWilayaCode("");
    setCommune("");
    setCouponCode("");
    setCoupon(null);
    onClose();
    navigate({ to: "/thank-you" });
  };

  const eta = selectedWilaya ? estimateDelivery(selectedWilaya.wilaya_code, delivery) : null;

  return (
    <Modal open={open} onClose={onClose} title="إتمام الطلب — الدفع عند الاستلام">
      <form onSubmit={submit} onBlur={saveDraft} className="space-y-3">
        <Field label="الاسم واللقب">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="fld"
            placeholder="أدخل اسمك الكامل"
            required
          />
        </Field>
        <Field label="رقم الهاتف">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            maxLength={20}
            className="fld"
            placeholder="05XX XX XX XX"
            required
          />
        </Field>
        <Field label="الولاية">
          <select
            value={wilayaCode}
            onChange={(e) => {
              setWilayaCode(e.target.value);
              setCommune("");
            }}
            className="fld"
            required
          >
            <option value="">اختر الولاية</option>
            {(wilayas ?? []).map((w) => (
              <option key={w.wilaya_code} value={w.wilaya_code}>
                {String(w.wilaya_code).padStart(2, "0")} - {w.wilaya_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="البلدية">
          <select
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            className="fld"
            disabled={!wilayaCode}
            required
          >
            <option value="">{wilayaCode ? "اختر البلدية" : "اختر الولاية أولاً"}</option>
            {(wilayaCode ? (COMMUNES[Number(wilayaCode)] ?? []) : []).map((cn) => (
              <option key={cn} value={cn}>
                {cn}
              </option>
            ))}
          </select>
        </Field>

        <Field label="خيار التوصيل">
          <div className="grid grid-cols-2 gap-2">
            <DeliveryOption
              active={delivery === "توصيل للمنزل"}
              onClick={() => setDelivery("توصيل للمنزل")}
              icon={<Home className="size-4" />}
              label="توصيل للمنزل"
              fee={freeShipping ? 0 : selectedWilaya ? Number(selectedWilaya.home_fee) : null}
            />
            <DeliveryOption
              active={delivery === "توصيل لمكتب الشحن"}
              onClick={() => setDelivery("توصيل لمكتب الشحن")}
              icon={<Building2 className="size-4" />}
              label="مكتب الشحن"
              fee={freeShipping ? 0 : selectedWilaya ? Number(selectedWilaya.desk_fee) : null}
            />
          </div>
        </Field>

        {eta && selectedWilaya && (
          <div className="rounded-2xl bg-primary/10 border border-primary/30 p-3 flex items-center gap-2 text-sm">
            <Truck className="size-4 text-primary" />
            <span>
              التوصيل لولاية <b>{selectedWilaya.wilaya_name}</b>: {eta}
            </span>
          </div>
        )}

        <Field label="رمز الخصم (اختياري)">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                maxLength={30}
                placeholder="مثال: WELCOME10"
                className="fld pr-9 uppercase"
              />
            </div>
            <button
              type="button"
              onClick={applyCoupon}
              disabled={checkingCoupon || !couponCode.trim()}
              className="h-11 px-4 rounded-xl btn-primary font-extrabold text-sm disabled:opacity-60"
            >
              {checkingCoupon ? <Loader2 className="size-4 animate-spin" /> : "تطبيق"}
            </button>
          </div>
          {coupon && (
            <div className="mt-1 text-xs text-success flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> تم تطبيق {coupon.code}: −{formatDZD(discount)}
              <button
                type="button"
                onClick={() => setCoupon(null)}
                className="mr-1 text-muted-foreground hover:text-destructive"
                aria-label="إزالة"
              >
                <XCircle className="size-3.5" />
              </button>
            </div>
          )}
        </Field>

        <div className="rounded-2xl glass p-3 space-y-1.5 text-sm">
          <Row label="المنتجات" value={formatDZD(subtotal)} />
          {discount > 0 && (
            <Row label={`خصم (${coupon?.code ?? ""})`} value={`− ${formatDZD(discount)}`} />
          )}
          <Row
            label="رسوم التوصيل"
            value={freeShipping ? "توصيل مجاني" : selectedWilaya ? formatDZD(shippingFee) : "—"}
          />
          <div className="border-t border-white/10 pt-2 flex items-center justify-between">
            <span className="font-bold">الإجمالي</span>
            <span className="text-xl font-extrabold text-primary">{formatDZD(grandTotal)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-13 py-3.5 rounded-2xl btn-primary font-extrabold text-base disabled:opacity-60 transition flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
          {submitting ? "جارٍ الإرسال..." : "تأكيد الطلب"}
        </button>

        <style>{`.fld{width:100%;height:44px;border-radius:14px;border:1px solid var(--border);padding:0 14px;font-size:14px;background:var(--input);color:var(--foreground);outline:none}.fld:focus{border-color:var(--primary)}select.fld{appearance:none}`}</style>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function DeliveryOption({
  active,
  onClick,
  icon,
  label,
  fee,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  fee: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-16 rounded-2xl border-2 font-semibold text-xs transition flex flex-col items-center justify-center gap-1 ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-white/10 text-muted-foreground hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      {fee != null && (
        <div className="text-[11px] opacity-80">{formatDZD(fee)}</div>
      )}
    </button>
  );
}
