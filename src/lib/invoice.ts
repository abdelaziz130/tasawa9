import type { CartItemLite, Order } from "@/lib/types";
import { formatDZD } from "@/lib/format";

export function printInvoice(order: Order) {
  const items = (order.cart_items ?? []) as CartItemLite[];
  const shipping = Number(order.shipping_fee ?? 0);
  const subtotal = Number(order.total_price) - shipping;
  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.title)}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:left">${formatDZD(i.price * i.quantity)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>وصل شحن #${order.id.slice(0, 8)}</title>
<style>
* { box-sizing: border-box; }
body { font-family: -apple-system, "Segoe UI", "Tajawal", "Cairo", sans-serif; margin: 24px; color: #111; }
h1 { margin: 0 0 4px; font-size: 20px; }
.muted { color: #666; font-size: 12px; }
.box { border: 1px solid #ddd; border-radius: 10px; padding: 12px; margin-top: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: right; }
th { background: #f7f7f7; }
.tot { display:flex; justify-content:space-between; padding: 4px 0; font-size:13px;}
.tot.big { font-size:16px; font-weight:800; border-top: 2px solid #111; margin-top:6px; padding-top:8px;}
.hdr { display:flex; justify-content:space-between; align-items:flex-start; }
.badge { padding: 4px 10px; border-radius: 999px; background: #111; color:#fff; font-size:11px; font-weight:700; }
@media print { .noprint { display:none } body { margin: 12mm } }
</style></head><body>
<div class="hdr">
  <div>
    <h1>وصل شحن — متجر الجزائر</h1>
    <div class="muted">رقم الطلب: ${order.id.slice(0, 8).toUpperCase()}</div>
    <div class="muted">${new Date(order.created_at).toLocaleString("ar-DZ")}</div>
  </div>
  <span class="badge">${escapeHtml(order.status)}</span>
</div>

<div class="box">
  <div class="grid">
    <div><b>الزبون:</b> ${escapeHtml(order.customer_name)}</div>
    <div><b>الهاتف:</b> ${escapeHtml(order.phone)}</div>
    <div><b>الولاية:</b> ${escapeHtml(order.wilaya)}</div>
    <div><b>البلدية:</b> ${escapeHtml(order.commune)}</div>
    <div style="grid-column:1/-1"><b>نوع التوصيل:</b> ${escapeHtml(order.delivery_type)}</div>
  </div>
</div>

<table>
  <thead><tr><th>المنتج</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="box" style="margin-top:12px">
  <div class="tot"><span>المنتجات</span><span>${formatDZD(subtotal)}</span></div>
  <div class="tot"><span>رسوم التوصيل</span><span>${formatDZD(shipping)}</span></div>
  <div class="tot big"><span>الإجمالي (الدفع عند الاستلام)</span><span>${formatDZD(order.total_price)}</span></div>
</div>

<div class="muted" style="margin-top:16px">شكراً لطلبكم — يرجى تجهيز المبلغ المذكور عند التسليم.</div>
<div class="noprint" style="margin-top:16px"><button onclick="window.print()">طباعة</button></div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body></html>`;

  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
