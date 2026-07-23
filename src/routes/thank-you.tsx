import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { formatDZD } from "@/lib/format";
import { CheckCircle2, PhoneCall, Home, Package } from "lucide-react";

type OrderSnapshot = {
  id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  delivery_type: string;
  shipping_fee: number;
  subtotal: number;
  total: number;
  items: Array<{ title: string; price: number; quantity: number }>;
};

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "شكراً لطلبك — متجر الجزائر" },
      { name: "description", content: "تم استلام طلبك بنجاح." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("last_order");
      if (raw) setOrder(JSON.parse(raw) as OrderSnapshot);
    } catch {}
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!order) {
    return (
      <>
        <AppHeader />
        <main className="px-4 py-10 text-center space-y-4">
          <p className="text-muted-foreground">لا يوجد طلب أخير للعرض.</p>
          <Link to="/" className="inline-block rounded-xl btn-primary px-5 py-2.5 font-bold">
            العودة للرئيسية
          </Link>
        </main>
      </>
    );
  }

  const code = order.id.slice(0, 8).toUpperCase();

  return (
    <>
      <AppHeader />
      <main className="px-3 py-4 space-y-4">
        <div className="rounded-3xl glass p-6 text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <div className="mx-auto size-20 rounded-full bg-primary/20 grid place-items-center relative">
            <CheckCircle2 className="size-12 text-primary" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold">شكراً لطلبك!</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            سيتصل بك فريقنا هاتفياً لتأكيد الشحن خلال ساعات.
          </p>
          <div className="glass rounded-2xl px-4 py-2 inline-flex items-center gap-2 font-bold">
            <Package className="size-4 text-accent" /> رمز الطلب:
            <span className="font-mono tracking-widest text-primary">{code}</span>
          </div>
        </div>

        <div className="rounded-2xl glass p-4 space-y-3">
          <h2 className="font-extrabold">تفاصيل الطلب</h2>
          <ul className="space-y-1.5 text-sm">
            {order.items.map((it, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {it.quantity}× {it.title}
                </span>
                <span className="font-semibold shrink-0">
                  {formatDZD(it.price * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10 pt-2 space-y-1 text-sm">
            <Row label="المجموع" value={formatDZD(order.subtotal)} />
            <Row label="التوصيل" value={formatDZD(order.shipping_fee)} />
            <div className="flex justify-between font-extrabold text-lg pt-1">
              <span>الإجمالي</span>
              <span className="text-primary">{formatDZD(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl glass p-4 space-y-2 text-sm">
          <h2 className="font-extrabold mb-1">معلومات الشحن</h2>
          <Row label="الاسم" value={order.customer_name} />
          <Row label="الهاتف" value={order.phone} />
          <Row label="الولاية" value={order.wilaya} />
          <Row label="البلدية" value={order.commune} />
          <Row label="التوصيل" value={order.delivery_type} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${order.phone}`}
            className="h-12 rounded-2xl glass font-bold flex items-center justify-center gap-2"
          >
            <PhoneCall className="size-4" /> اتصل بنا
          </a>
          <Link
            to="/"
            className="h-12 rounded-2xl btn-primary font-extrabold flex items-center justify-center gap-2"
          >
            <Home className="size-4" /> العودة للرئيسية
          </Link>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
