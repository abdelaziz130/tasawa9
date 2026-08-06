import { formatDZD } from "@/lib/format";
import type { Order } from "@/lib/types";

/**
 * Prints a compact shipping receipt (80mm thermal friendly).
 * Privacy: product names / item details are intentionally NOT printed.
 */
export function printInvoice(order: Order) {
  const shipping = Number(order.shipping_fee ?? 0);
  const ref = order.id.slice(0, 8).toUpperCase();

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>وصل شحن #${ref}</title>
<style>
@page { size: 80mm auto; margin: 4mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, "Segoe UI", "Tajawal", "Cairo", sans-serif; margin: 0 auto; padding: 6px; color: #000; width: 76mm; font-size: 12px; }
.center { text-align: center; }
h1 { margin: 0; font-size: 15px; letter-spacing: .5px; }
.ref { margin-top: 2px; font-size: 16px; font-weight: 800; font-family: monospace; }
.muted { color: #444; font-size: 10px; }
.sep { border-top: 1px dashed #000; margin: 8px 0; }
.row { display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; font-size: 12px; }
.row span:first-child { color: #333; }
.row span:last-child { font-weight: 700; text-align: left; }
.total { border-top: 2px solid #000; margin-top: 6px; padding-top: 6px; font-size: 14px; font-weight: 800; }
.note { margin-top: 8px; font-size: 10px; text-align: center; color: #333; }
@media print { .noprint { display: none } }
</style></head><body>
<div class="center">
  <h1>وصل شحن — تسوق | Tasawa9</h1>
  <div class="ref">#${ref}</div>
  <div class="muted">${new Date(order.created_at).toLocaleString("ar-DZ")}</div>
</div>

<div class="sep"></div>

<div class="row"><span>الزبون</span><span>${escapeHtml(order.customer_name)}</span></div>
<div class="row"><span>الهاتف</span><span dir="ltr">${escapeHtml(order.phone)}</span></div>
<div class="row"><span>الولاية</span><span>${escapeHtml(order.wilaya)}</span></div>
<div class="row"><span>البلدية</span><span>${escapeHtml(order.commune)}</span></div>
<div class="row"><span>نوع التوصيل</span><span>${escapeHtml(order.delivery_type)}</span></div>

<div class="sep"></div>

<div class="row"><span>رسوم التوصيل</span><span>${formatDZD(shipping)}</span></div>
<div class="row total"><span>المبلغ الإجمالي</span><span>${formatDZD(order.total_price)}</span></div>

<div class="note">الدفع عند الاستلام — يرجى تجهيز المبلغ المذكور.</div>

<div class="noprint center" style="margin-top:12px"><button onclick="window.print()">طباعة</button></div>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body></html>`;

  const w = window.open("", "_blank", "width=420,height=760");
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
