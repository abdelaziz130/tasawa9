import { Facebook, MessageCircle, Share2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatDZD } from "@/lib/format";
import { toast } from "sonner";

export function ShareButtons({ product }: { product: Product }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/?p=${product.id}`
      : `/?p=${product.id}`;
  const text = `🔥 عرض حصري: ${product.title} بسعر ${formatDZD(product.price)} فقط! الدفع عند الاستلام لجميع ولايات الجزائر 🇩🇿\n${url}`;

  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;

  const native = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: product.title,
          text,
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-semibold">شارك:</span>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="واتساب"
        className="size-9 grid place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition"
      >
        <MessageCircle className="size-4" />
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="فيسبوك"
        className="size-9 grid place-items-center rounded-xl bg-[#1877F2]/15 text-[#1877F2] hover:bg-[#1877F2]/25 transition"
      >
        <Facebook className="size-4" />
      </a>
      <button
        type="button"
        onClick={native}
        aria-label="مشاركة"
        className="size-9 grid place-items-center rounded-xl glass hover:bg-white/10 transition"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
