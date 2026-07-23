import type { Product } from "@/lib/types";
import { Flame } from "lucide-react";

export function StoriesBanner({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
}) {
  const featured = products
    .filter((p) => p.old_price && p.old_price > p.price)
    .slice(0, 10);
  const items = featured.length > 0 ? featured : products.slice(0, 10);
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Flame className="size-4 text-accent" />
        <h2 className="text-sm font-extrabold">عروض حصرية</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-none">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="shrink-0 flex flex-col items-center gap-1.5 w-16"
          >
            <span className="relative rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary-glow">
              <span className="block rounded-full p-[2px] bg-background">
                <span className="block size-14 rounded-full overflow-hidden bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </span>
              </span>
            </span>
            <span className="text-[10px] font-semibold text-center line-clamp-1 w-full">
              {p.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
