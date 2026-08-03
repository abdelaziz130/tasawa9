import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CustomerMenu } from "./CustomerMenu";
import { useStoreSettings } from "@/lib/settings";
import logo from "@/assets/logo.png";


export function AppHeader({
  search,
  onSearch,
}: {
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const { data: settings } = useStoreSettings();


  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border">
      <div className="mx-auto max-w-md lg:max-w-7xl px-4 pt-4 pb-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="تسوق Tasawa9"
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-2xl object-cover ring-1 ring-primary/40"
            />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-lg font-extrabold tracking-tight bg-gradient-to-l from-primary to-primary-glow bg-clip-text text-transparent">
                {settings?.store_name || "تسوق | Tasawa9"}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                توصيل لجميع الولايات
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <CustomerMenu />
          </div>

        </div>
        {onSearch && (
          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full h-11 rounded-2xl glass text-foreground pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}
