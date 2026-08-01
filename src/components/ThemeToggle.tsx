import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="تبديل السمة"
      className="grid size-10 place-items-center rounded-2xl glass hover:bg-primary/10 transition"
    >
      {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
