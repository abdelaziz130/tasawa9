import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CopyInput = { title: string; category?: string | null; price?: number | null };
type LandingInput = { productId: string };

const MODEL = "google/gemini-3.6-flash";

async function callAI(system: string, user: string, jsonMode: boolean) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("خدمة الذكاء الاصطناعي غير متوفرة حالياً");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error("تعذّر توليد المحتوى، حاول مرة أخرى");
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("لم يتم توليد أي محتوى");
  return content;
}

/** AI copywriter: Algerian-Arabic sales description + auto search tags. */
export const generateProductCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CopyInput) => {
    const title = String(input?.title ?? "").trim();
    if (!title) throw new Error("عنوان المنتج مطلوب");
    return {
      title: title.slice(0, 160),
      category: input.category ? String(input.category).slice(0, 60) : null,
      price: input.price ?? null,
    };
  })
  .handler(async ({ data }) => {
    const raw = await callAI(
      `أنت كاتب محتوى تسويقي لمتجر إلكتروني جزائري (الدفع عند الاستلام). اكتب بالعربية الجزائرية البسيطة والمقنعة.
أرجع JSON فقط بالشكل: {"description": "...", "tags": ["...", "..."], "category": "..."}
- description: 3 إلى 5 أسطر قصيرة، تبدأ بجملة جذابة، تذكر الفوائد لا المواصفات فقط، وتنتهي بدعوة للشراء. استعمل رموز تعبيرية بشكل معتدل.
- tags: من 4 إلى 8 كلمات بحث عربية قصيرة.
- category: قسم واحد مناسب بالعربية.`,
      `المنتج: ${data.title}${data.category ? `\nالقسم الحالي: ${data.category}` : ""}${
        data.price ? `\nالسعر: ${data.price} دج` : ""
      }`,
      true,
    );
    let parsed: { description?: string; tags?: unknown; category?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { description: raw };
    }
    return {
      description: String(parsed.description ?? "").trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
        : [],
      category: parsed.category ? String(parsed.category).trim() : null,
    };
  });

/** AI landing page generator: writes a high-converting page and stores it on the product. */
export const generateLandingPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: LandingInput) => {
    const productId = String(input?.productId ?? "").trim();
    if (!productId) throw new Error("معرّف المنتج مطلوب");
    return { productId };
  })
  .handler(async ({ data, context }) => {
    const { data: product, error } = await context.supabase
      .from("products")
      .select("id,title,description,price,old_price,category")
      .eq("id", data.productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("المنتج غير موجود");

    const raw = await callAI(
      `أنت خبير صفحات هبوط لمتجر جزائري (الدفع عند الاستلام). أرجع JSON فقط بالشكل:
{"headline":"...","subheadline":"...","pains":["...","...","..."],"benefits":["...","...","...","..."],"cta":"..."}
اكتب بالعربية الجزائرية المقنعة. pains: 3 مشاكل يعاني منها الزبون. benefits: 4 حلول/فوائد. cta: جملة زر شراء قصيرة.
ممنوع تماماً اختراع آراء أو تعليقات زبائن.`,
      `المنتج: ${product.title}\nالوصف: ${product.description ?? "—"}\nالسعر: ${product.price} دج\nالقسم: ${product.category ?? "—"}`,
      true,
    );

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("تعذّر قراءة محتوى الصفحة");
    }

    const asStrings = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 6) : [];

    const landing_content = {
      headline: String(parsed["headline"] ?? product.title).trim(),
      subheadline: String(parsed["subheadline"] ?? "").trim(),
      pains: asStrings(parsed["pains"]),
      benefits: asStrings(parsed["benefits"]),
      cta: String(parsed["cta"] ?? "اطلب الآن").trim(),
    };

    const slug = `${slugify(product.title)}-${product.id.slice(0, 6)}`;
    const { error: upErr } = await context.supabase
      .from("products")
      .update({ landing_slug: slug, landing_content })
      .eq("id", product.id);
    if (upErr) throw new Error(upErr.message);

    return { slug, landing_content };
  });

function slugify(s: string) {
  const base = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "product";
}
