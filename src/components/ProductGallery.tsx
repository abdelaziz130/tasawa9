import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/shorts/"))
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    return url;
  } catch {
    return null;
  }
}

export function ProductGallery({
  images,
  videoUrl,
  title,
}: {
  images: string[];
  videoUrl?: string | null;
  title: string;
}) {
  const [i, setI] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const embed = videoUrl ? toEmbed(videoUrl) : null;
  const total = images.length;

  useEffect(() => {
    setI(0);
    setShowVideo(false);
  }, [title]);

  const go = (d: number) => setI((v) => (total ? (v + d + total) % total : 0));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        className="relative aspect-square w-full overflow-hidden rounded-3xl bg-muted"
      >
        {showVideo && embed ? (
          <iframe
            src={embed}
            title={`${title} - فيديو`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : total > 0 ? (
          <img
            src={images[i]}
            alt={title}
            className="size-full object-cover transition-transform duration-200 md:hover:scale-[1.8]"
            style={
              zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : { transformOrigin: "center" }
            }
          />
        ) : (
          <div className="grid size-full place-items-center text-5xl">📦</div>
        )}

        {!showVideo && total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="السابق"
              className="absolute top-1/2 right-2 -translate-y-1/2 size-9 grid place-items-center rounded-full glass-strong"
            >
              <ChevronRight className="size-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="التالي"
              className="absolute top-1/2 left-2 -translate-y-1/2 size-9 grid place-items-center rounded-full glass-strong"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
              {images.map((_, n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-primary" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {(total > 1 || embed) && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {embed && (
            <button
              onClick={() => setShowVideo(true)}
              className={`relative size-16 shrink-0 rounded-xl grid place-items-center glass ${showVideo ? "ring-2 ring-primary" : ""}`}
              aria-label="مشاهدة الفيديو"
            >
              <Play className="size-6 text-primary" fill="currentColor" />
            </button>
          )}
          {images.map((src, n) => (
            <button
              key={src}
              onClick={() => {
                setShowVideo(false);
                setI(n);
              }}
              className={`size-16 shrink-0 overflow-hidden rounded-xl ${!showVideo && n === i ? "ring-2 ring-primary" : "opacity-70"}`}
            >
              <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
