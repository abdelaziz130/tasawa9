import { useState } from "react";
import { Modal } from "./Modal";
import { WILAYAS } from "@/lib/wilayas";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [delivery, setDelivery] = useState<"توصيل للمنزل" | "توصيل للمكتب">("توصيل للمنزل");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      toast.error("السلة فارغة");
      return;
    }
    if (!name.trim() || !phone.trim() || !wilaya || !commune.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      customer_name: name.trim(),
      phone: phone.trim(),
      wilaya,
      commune: commune.trim(),
      delivery_type: delivery,
      cart_items: items.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
      total_price: total,
      status: "جديد",
    });
    setSubmitting(false);
    if (error) {
      toast.error("فشل إرسال الطلب: " + error.message);
      return;
    }
    setDone(true);
    clear();
    setTimeout(() => {
      setDone(false);
      setName("");
      setPhone("");
      setWilaya("");
      setCommune("");
      onClose();
    }, 2200);
  };

  return (
    <Modal open={open} onClose={onClose} title="إتمام الطلب — الدفع عند الاستلام">
      {done ? (
        <div className="text-center py-8 space-y-3">
          <CheckCircle2 className="mx-auto size-16 text-success" />
          <h3 className="text-xl font-bold">تم إرسال طلبك بنجاح!</h3>
          <p className="text-muted-foreground text-sm">سنتصل بك قريباً لتأكيد الطلب.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl bg-secondary p-3 text-sm flex items-center justify-between">
            <span className="text-secondary-foreground font-medium">
              {items.length} منتج • المجموع
            </span>
            <span className="font-extrabold text-primary text-lg">{formatDZD(total)}</span>
          </div>

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
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="fld bg-white"
              required
            >
              <option value="">اختر الولاية</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
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
          <Field label="نوع التوصيل">
            <div className="grid grid-cols-2 gap-2">
              {(["توصيل للمنزل", "توصيل للمكتب"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDelivery(d)}
                  className={`h-11 rounded-xl border-2 font-semibold text-sm transition ${
                    delivery === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-base hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {submitting ? "جارٍ الإرسال..." : "تأكيد الطلب"}
          </button>

          <style>{`.fld{width:100%;height:44px;border-radius:12px;border:1px solid var(--border);padding:0 14px;font-size:14px;background:var(--input);outline:none}.fld:focus{border-color:var(--primary)}`}</style>
        </form>
      )}
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
