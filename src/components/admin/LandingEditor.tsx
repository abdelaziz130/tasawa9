import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Modal } from "@/components/Modal";
import { productImages, type LandingContent, type Product } from "@/lib/types";
import { downloadHtml, landingPageHtml } from "@/lib/landing-export";
import { Download, Link2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const inp =
  "w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary";

function emptyContent(p: Product): LandingContent {
  return {
    headline: p.title,
    subheadline: "",
    pains: [],
    benefits: [],
    cta: "اطلب الآن",
  };
}

/** Live visual editor for an AI-generated landing page (text, headings, images). */
export function LandingEditor({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [c, setC] = useState<LandingContent>(product.landing_content ?? emptyContent(product));
  const [images, setImages] = useState<string[]>(productImages(product));
  const [busy, setBusy] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && product.landing_slug
      ? `${window.location.origin}/p/${product.landing_slug}`
      : "";

  const setList = (key: "pains" | "benefits", i: number, v: string) =>
    setC((prev) => {
      const arr = [...prev[key]];
      arr[i] = v;
      return { ...prev, [key]: arr };
    });

  const addItem = (key: "pains" | "benefits") =>
    setC((prev) => ({ ...prev, [key]: [...prev[key], ""] }));

  const removeItem = (key: "pains" | "benefits", i: number) =>
    setC((prev) => ({ ...prev, [key]: prev[key].filter((_, n) => n !== i) }));

  const save = async () => {
    setBusy(true);
    const clean: LandingContent = {
      headline: c.headline.trim() || product.title,
      subheadline: c.subheadline.trim(),
      pains: c.pains.map((t) => t.trim()).filter(Boolean),
      benefits: c.benefits.map((t) => t.trim()).filter(Boolean),
      cta: c.cta.trim() || "اطلب الآن",
    };
    const imgs = images.map((u) => u.trim()).filter(Boolean);
    const { error } = await supabase
      .from("products")
      .update({
        landing_content: clean,
        images: imgs,
        image_url: imgs[0] ?? product.image_url,
      })
      .eq("id", product.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ صفحة الهبوط");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    onClose();
  };

  const copyLink = async () => {
    if (!shareUrl) return toast.error("أنشئ صفحة الهبوط أولاً");
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ رابط الصفحة");
    } catch {
      toast.error("تعذّر النسخ، انسخ الرابط يدوياً");
    }
  };

  const download = () => {
    const html = landingPageHtml(
      { ...product, images, landing_content: c } as Product,
      c,
      shareUrl || "#",
    );
    downloadHtml(`${product.landing_slug ?? "landing"}.html`, html);
    toast.success("تم تنزيل ملف الصفحة");
  };

  return (
    <Modal open={open} onClose={onClose} title="محرّر صفحة الهبوط">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyLink}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl glass text-xs font-extrabold"
          >
            <Link2 className="size-4" /> نسخ رابط المشاركة
          </button>
          <button
            onClick={download}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl glass text-xs font-extrabold"
          >
            <Download className="size-4" /> تنزيل HTML
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold">العنوان الرئيسي</span>
          <input
            value={c.headline}
            onChange={(e) => setC({ ...c, headline: e.target.value })}
            className={inp}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold">العنوان الفرعي</span>
          <textarea
            value={c.subheadline}
            onChange={(e) => setC({ ...c, subheadline: e.target.value })}
            rows={2}
            className={inp}
          />
        </label>

        {(["pains", "benefits"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">
                {key === "pains" ? "المشاكل (هل تعاني من هذا؟)" : "الفوائد (الحل معنا)"}
              </span>
              <button
                onClick={() => addItem(key)}
                className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-extrabold text-primary"
              >
                <Plus className="size-3" /> إضافة
              </button>
            </div>
            {c[key].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={t} onChange={(e) => setList(key, i, e.target.value)} className={inp} />
                <button
                  onClick={() => removeItem(key, i)}
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold">صور الصفحة</span>
            <button
              onClick={() => setImages((v) => [...v, ""])}
              className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-extrabold text-primary"
            >
              <Plus className="size-3" /> إضافة صورة
            </button>
          </div>
          {images.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              {u ? (
                <img src={u} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="size-10 shrink-0 rounded-xl glass" />
              )}
              <input
                value={u}
                dir="ltr"
                onChange={(e) =>
                  setImages((prev) => prev.map((x, n) => (n === i ? e.target.value : x)))
                }
                className={inp}
              />
              <button
                onClick={() => setImages((prev) => prev.filter((_, n) => n !== i))}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"
                aria-label="حذف الصورة"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-extrabold">نص زر الشراء</span>
          <input value={c.cta} onChange={(e) => setC({ ...c, cta: e.target.value })} className={inp} />
        </label>

        <button
          onClick={save}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl btn-primary font-extrabold disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          حفظ ونشر
        </button>
      </div>
    </Modal>
  );
}
