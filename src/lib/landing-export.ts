import type { LandingContent, Product } from "@/lib/types";
import { productImages } from "@/lib/types";
import { formatDZD } from "@/lib/format";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds a standalone, self-contained HTML landing page for download / hosting. */
export function landingPageHtml(product: Product, c: LandingContent, orderUrl: string) {
  const imgs = productImages(product).slice(0, 4);
  const list = (items: string[], icon: string) =>
    items.map((t) => `<li><span class="ic">${icon}</span>${esc(t)}</li>`).join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(c.headline || product.title)}</title>
<meta name="description" content="${esc(c.subheadline || product.title)}" />
<style>
  :root{--bg:#0b0f14;--card:#141a22;--txt:#eef2f7;--mut:#93a2b5;--pri:#22a6f2;--acc:#ff8a1f}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);font-family:system-ui,"Segoe UI",Tahoma,sans-serif}
  .wrap{max-width:720px;margin:0 auto;padding:20px 16px 110px}
  .card{background:var(--card);border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:16px;margin-top:14px}
  h1{font-size:26px;line-height:1.35;margin:0}
  p.sub{color:var(--mut);margin:8px 0 0;font-size:15px}
  .imgs{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
  .imgs img{width:100%;height:190px;object-fit:cover;border-radius:18px}
  .price{font-size:26px;font-weight:800;color:var(--pri)}
  .old{color:var(--mut);text-decoration:line-through;font-size:14px;margin-inline-start:8px}
  h2{font-size:15px;margin:0 0 8px}
  ul{list-style:none;margin:0;padding:0}
  li{display:flex;gap:8px;align-items:flex-start;font-size:14px;padding:5px 0}
  .ic{flex:0 0 auto}
  .trust{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}
  .trust div{background:var(--card);border-radius:18px;padding:12px;text-align:center;font-size:13px;font-weight:700}
  .cta{position:fixed;inset-inline:0;bottom:0;padding:12px 16px;background:linear-gradient(to top,rgba(11,15,20,.98),rgba(11,15,20,.75))}
  .cta a{display:block;max-width:720px;margin:0 auto;text-align:center;background:var(--pri);color:#04121d;font-weight:900;padding:16px;border-radius:18px;text-decoration:none;font-size:16px}
  footer{color:var(--mut);text-align:center;font-size:12px;margin-top:18px}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>${esc(c.headline || product.title)}</h1>
    ${c.subheadline ? `<p class="sub">${esc(c.subheadline)}</p>` : ""}
  </div>
  ${imgs.length ? `<div class="imgs">${imgs.map((u) => `<img src="${esc(u)}" alt="${esc(product.title)}" />`).join("")}</div>` : ""}
  <div class="card">
    <div><span class="price">${formatDZD(product.price)}</span>${
      product.old_price && Number(product.old_price) > Number(product.price)
        ? `<span class="old">${formatDZD(product.old_price)}</span>`
        : ""
    }</div>
    ${product.description ? `<p class="sub">${esc(product.description)}</p>` : ""}
  </div>
  ${c.pains.length ? `<div class="card"><h2>هل تعاني من هذا؟</h2><ul>${list(c.pains, "❌")}</ul></div>` : ""}
  ${c.benefits.length ? `<div class="card"><h2>الحل معنا</h2><ul>${list(c.benefits, "✅")}</ul></div>` : ""}
  <div class="trust"><div>🚚 توصيل 58 ولاية</div><div>💵 الدفع عند الاستلام</div></div>
  <footer>جميع الحقوق محفوظة © تسوق | Tasawa9</footer>
</div>
<div class="cta"><a href="${esc(orderUrl)}">${esc(c.cta || "اطلب الآن")}</a></div>
</body>
</html>`;
}

export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
