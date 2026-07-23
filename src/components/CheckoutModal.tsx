import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Modal } from "./Modal";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import type { WilayaShipping } from "@/lib/types";
import { toast } from "sonner";
import { Home, Building2, Loader2 } from "lucide-react";

type DeliveryType = "توصيل للمنزل" | "توصيل لمكتب الشحن";

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

  const selectedWilaya = useMemo(
    () => wilayas?.find((w) => String(w.wilaya_code) === wilayaCode) ?? null,
    [wilayas, wilayaCode],
  );

  const shippingFee = selectedWilaya
    ? delivery === "توصيل للمنزل"
      ? Number(selectedWilaya.home_fee)
      : Number(selectedWilaya.desk_fee)
    : 0;
  const grandTotal = Number(subtotal) + shippingFee;

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

    clear();
    setName("");
    setPhone("");
    setWilayaCode("");
    setCommune("");
    onClose();
    navigate({ to: "/thank-you" });
  };

  return (
    <Modal open={open} onClose={onClose} title="إتمام الطلب — الدفع عند الاستلام">
      <form onSubmit={submit} className="space-y-3">
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
            onChange={(e) => setWilayaCode(e.target.value)}
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
          <input
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            maxLength={100}
            className="fld"
            placeholder="أدخل البلدية"
            required
          />
        </Field>

        <Field label="خيار التوصيل">
          <div className="grid grid-cols-2 gap-2">
            <DeliveryOption
              active={delivery === "توصيل للمنزل"}
              onClick={() => setDelivery("توصيل للمنزل")}
              icon={<Home className="size-4" />}
              label="توصيل للمنزل"
              fee={selectedWilaya ? Number(selectedWilaya.home_fee) : null}
            />
            <DeliveryOption
              active={delivery === "توصيل لمكتب الشحن"}
              onClick={() => setDelivery("توصيل لمكتب الشحن")}
              icon={<Building2 className="size-4" />}
              label="مكتب الشحن"
              fee={selectedWilaya ? Number(selectedWilaya.desk_fee) : null}
            />
          </div>
        </Field>

        <div className="rounded-2xl glass p-3 space-y-1.5 text-sm">
          <Row label="المنتجات" value={formatDZD(subtotal)} />
          <Row
            label="رسوم التوصيل"
            value={selectedWilaya ? formatDZD(shippingFee) : "—"}
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
