import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyTheme, DEFAULT_THEME, type Mode, type ThemeId } from "@/lib/themes";
import { useStoreSettings } from "@/lib/settings";

type Ctx = {
  theme: ThemeId;
  mode: Mode;
  setTheme: (t: ThemeId) => void;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

const THEME_KEY = "tasawa9_theme";
const MODE_KEY = "tasawa9_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mode, setModeState] = useState<Mode>("dark");
  const [userPicked, setUserPicked] = useState(false);
  const { data: settings } = useStoreSettings();

  // hydrate from localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY) as ThemeId | null;
      const m = localStorage.getItem(MODE_KEY) as Mode | null;
      if (t) {
        setThemeState(t);
        setUserPicked(true);
      }
      if (m === "light" || m === "dark") setModeState(m);
    } catch {}
  }, []);

  // fall back to the store-wide default theme when the visitor never picked one
  useEffect(() => {
    if (userPicked) return;
    const d = settings?.default_theme as ThemeId | undefined;
    if (d) setThemeState(d);
  }, [settings?.default_theme, userPicked]);

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode]);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    setUserPicked(true);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };
  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}
