import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  created_at: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const reviews = data ?? [];
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("review-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      setUploading(false);
      toast.error("فشل رفع الصورة");
      return;
    }
    const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("أدخل اسمك");
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
      photo_url: photoUrl,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("شكراً على تقييمك");
    setName("");
    setRating(5);
    setComment("");
    setPhotoUrl(null);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return (
    <div className="space-y-3 rounded-2xl glass p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Stars value={avg} />
            <span className="text-xs font-bold">{avg > 0 ? avg.toFixed(1) : "—"}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
          <div className="text-sm font-extrabold mt-1">آراء العملاء</div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-8 px-3 rounded-xl btn-primary text-xs font-extrabold"
        >
          {open ? "إلغاء" : "أضف تقييمك"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-2 pt-2 border-t border-white/10">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="اسمك"
            className="w-full h-10 rounded-xl bg-input border border-white/10 px-3 text-sm outline-none focus:border-primary"
            required
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}/5`}
              >
                <Star
                  className={`size-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={400}
            rows={2}
            placeholder="اكتب رأيك..."
            className="w-full rounded-xl bg-input border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <label className="flex-1 h-10 rounded-xl border-2 border-dashed border-white/20 grid place-items-center text-xs text-muted-foreground cursor-pointer hover:bg-white/5">
              <span className="flex items-center gap-1.5">
                <Camera className="size-4" />
                {uploading ? "جارٍ الرفع..." : photoUrl ? "تغيير الصورة" : "أضف صورة (اختياري)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
              />
            </label>
            {photoUrl && (
              <img src={photoUrl} alt="" className="size-10 rounded-lg object-cover" />
            )}
          </div>
          <button
            disabled={saving || uploading}
            className="w-full h-10 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            نشر التقييم
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="py-4 grid place-items-center text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          كن أول من يقيّم هذا المنتج
        </div>
      ) : (
        <ul className="space-y-2">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.id} className="rounded-xl bg-white/5 p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{r.customer_name}</span>
                <Stars value={r.rating} small />
              </div>
              {r.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {r.comment}
                </p>
              )}
              {r.photo_url && (
                <img
                  src={r.photo_url}
                  alt=""
                  className="mt-1 size-24 rounded-lg object-cover"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stars({ value, small }: { value: number; small?: boolean }) {
  const size = small ? "size-3.5" : "size-4";
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}
