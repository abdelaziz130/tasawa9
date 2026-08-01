export type ThemeId =
  | "neon-cyber"
  | "royal-emerald"
  | "deep-purple"
  | "ocean-wave"
  | "clean-slate"
  | "luxury-gold";

export type Mode = "dark" | "light";

export type ThemePreset = {
  id: ThemeId;
  name: string;
  swatch: [string, string, string];
  /** CSS custom properties applied on :root for each mode */
  dark: Record<string, string>;
  light: Record<string, string>;
};

const base = {
  "--radius": "1rem",
};

function darkVars(o: {
  bg: string;
  card: string;
  primary: string;
  primaryGlow: string;
  primaryFg: string;
  accent: string;
  accentFg: string;
  hue: string;
}) {
  return {
    ...base,
    "--background": o.bg,
    "--foreground": "oklch(0.97 0.01 240)",
    "--card": o.card,
    "--card-foreground": "oklch(0.97 0.01 240)",
    "--popover": o.card,
    "--popover-foreground": "oklch(0.97 0.01 240)",
    "--primary": o.primary,
    "--primary-foreground": o.primaryFg,
    "--primary-glow": o.primaryGlow,
    "--secondary": `oklch(0.28 0.03 ${o.hue})`,
    "--secondary-foreground": "oklch(0.95 0.01 240)",
    "--muted": `oklch(0.25 0.02 ${o.hue})`,
    "--muted-foreground": `oklch(0.72 0.02 ${o.hue})`,
    "--accent": o.accent,
    "--accent-foreground": o.accentFg,
    "--destructive": "oklch(0.68 0.24 22)",
    "--destructive-foreground": "oklch(0.99 0.01 0)",
    "--success": "oklch(0.78 0.19 150)",
    "--success-foreground": "oklch(0.15 0.06 150)",
    "--warning": "oklch(0.84 0.17 78)",
    "--warning-foreground": "oklch(0.2 0.05 78)",
    "--border": `oklch(0.34 0.02 ${o.hue} / 0.6)`,
    "--input": `oklch(0.24 0.02 ${o.hue})`,
    "--ring": o.primary,
    "--grad-hero": `radial-gradient(120% 60% at 50% 0%, color-mix(in oklab, ${o.primary} 18%, ${o.bg}) 0%, transparent 62%), linear-gradient(180deg, color-mix(in oklab, ${o.card} 55%, ${o.bg}) 0%, ${o.bg} 100%)`,
    "--grad-primary": `linear-gradient(135deg, ${o.primary} 0%, ${o.primaryGlow} 100%)`,
    "--shadow-glow": `0 10px 40px -12px color-mix(in oklab, ${o.primary} 50%, transparent)`,
  };
}

function lightVars(o: {
  primary: string;
  primaryGlow: string;
  primaryFg: string;
  accent: string;
  accentFg: string;
  hue: string;
}) {
  return {
    ...base,
    "--background": `oklch(0.985 0.005 ${o.hue})`,
    "--foreground": `oklch(0.18 0.02 ${o.hue})`,
    "--card": "oklch(1 0 0)",
    "--card-foreground": `oklch(0.18 0.02 ${o.hue})`,
    "--popover": "oklch(1 0 0)",
    "--popover-foreground": `oklch(0.18 0.02 ${o.hue})`,
    "--primary": o.primary,
    "--primary-foreground": o.primaryFg,
    "--primary-glow": o.primaryGlow,
    "--secondary": `oklch(0.94 0.01 ${o.hue})`,
    "--secondary-foreground": `oklch(0.2 0.03 ${o.hue})`,
    "--muted": `oklch(0.94 0.01 ${o.hue})`,
    "--muted-foreground": `oklch(0.45 0.02 ${o.hue})`,
    "--accent": o.accent,
    "--accent-foreground": o.accentFg,
    "--destructive": "oklch(0.6 0.24 22)",
    "--destructive-foreground": "oklch(0.99 0.01 0)",
    "--success": "oklch(0.6 0.18 150)",
    "--success-foreground": "oklch(0.99 0.01 150)",
    "--warning": "oklch(0.72 0.17 78)",
    "--warning-foreground": "oklch(0.18 0.05 78)",
    "--border": `oklch(0.88 0.01 ${o.hue} / 0.9)`,
    "--input": `oklch(0.96 0.005 ${o.hue})`,
    "--ring": o.primary,
    "--grad-hero": `radial-gradient(120% 60% at 50% 0%, color-mix(in oklab, ${o.primary} 16%, white) 0%, transparent 60%), linear-gradient(180deg, oklch(0.99 0.005 ${o.hue}) 0%, oklch(0.96 0.008 ${o.hue}) 100%)`,
    "--grad-primary": `linear-gradient(135deg, ${o.primary} 0%, ${o.primaryGlow} 100%)`,
    "--shadow-glow": `0 10px 40px -14px color-mix(in oklab, ${o.primary} 35%, transparent)`,
  };
}

export const THEMES: ThemePreset[] = [
  {
    id: "neon-cyber",
    name: "نيون سايبر",
    swatch: ["#111318", "#0ea5ff", "#ff8a1f"],
    dark: darkVars({
      bg: "oklch(0.17 0.012 265)",
      card: "oklch(0.22 0.015 265)",
      primary: "oklch(0.72 0.19 245)",
      primaryGlow: "oklch(0.82 0.16 235)",
      primaryFg: "oklch(0.14 0.04 250)",
      accent: "oklch(0.78 0.19 55)",
      accentFg: "oklch(0.18 0.06 55)",
      hue: "265",
    }),
    light: lightVars({
      primary: "oklch(0.58 0.19 250)",
      primaryGlow: "oklch(0.68 0.17 240)",
      primaryFg: "oklch(0.99 0.01 250)",
      accent: "oklch(0.68 0.19 55)",
      accentFg: "oklch(0.15 0.05 55)",
      hue: "265",
    }),
  },
  {
    id: "royal-emerald",
    name: "زمرد ملكي",
    swatch: ["#06281f", "#12a97a", "#d4af37"],
    dark: darkVars({
      bg: "oklch(0.17 0.03 165)",
      card: "oklch(0.22 0.035 165)",
      primary: "oklch(0.72 0.16 162)",
      primaryGlow: "oklch(0.82 0.15 158)",
      primaryFg: "oklch(0.14 0.05 165)",
      accent: "oklch(0.82 0.14 88)",
      accentFg: "oklch(0.18 0.05 88)",
      hue: "165",
    }),
    light: lightVars({
      primary: "oklch(0.55 0.14 162)",
      primaryGlow: "oklch(0.66 0.15 158)",
      primaryFg: "oklch(0.99 0.01 160)",
      accent: "oklch(0.72 0.14 88)",
      accentFg: "oklch(0.18 0.05 88)",
      hue: "165",
    }),
  },
  {
    id: "deep-purple",
    name: "بنفسجي داكن",
    swatch: ["#150e2b", "#8b5cf6", "#ff2fb9"],
    dark: darkVars({
      bg: "oklch(0.17 0.04 295)",
      card: "oklch(0.22 0.045 295)",
      primary: "oklch(0.68 0.2 300)",
      primaryGlow: "oklch(0.78 0.18 310)",
      primaryFg: "oklch(0.99 0.01 300)",
      accent: "oklch(0.72 0.26 340)",
      accentFg: "oklch(0.99 0.01 340)",
      hue: "295",
    }),
    light: lightVars({
      primary: "oklch(0.55 0.2 300)",
      primaryGlow: "oklch(0.65 0.19 310)",
      primaryFg: "oklch(0.99 0.01 300)",
      accent: "oklch(0.62 0.25 340)",
      accentFg: "oklch(0.99 0.01 340)",
      hue: "295",
    }),
  },
  {
    id: "ocean-wave",
    name: "موج المحيط",
    swatch: ["#0a1b33", "#22d3ee", "#38bdf8"],
    dark: darkVars({
      bg: "oklch(0.17 0.035 250)",
      card: "oklch(0.22 0.04 250)",
      primary: "oklch(0.78 0.13 205)",
      primaryGlow: "oklch(0.86 0.12 198)",
      primaryFg: "oklch(0.15 0.05 220)",
      accent: "oklch(0.76 0.14 232)",
      accentFg: "oklch(0.15 0.05 232)",
      hue: "250",
    }),
    light: lightVars({
      primary: "oklch(0.6 0.13 220)",
      primaryGlow: "oklch(0.7 0.13 205)",
      primaryFg: "oklch(0.99 0.01 220)",
      accent: "oklch(0.62 0.15 235)",
      accentFg: "oklch(0.99 0.01 235)",
      hue: "250",
    }),
  },
  {
    id: "clean-slate",
    name: "رمادي نقي",
    swatch: ["#1c1c1e", "#f4f4f5", "#a1a1aa"],
    dark: darkVars({
      bg: "oklch(0.19 0.003 260)",
      card: "oklch(0.24 0.004 260)",
      primary: "oklch(0.95 0.002 260)",
      primaryGlow: "oklch(0.99 0.001 260)",
      primaryFg: "oklch(0.18 0.004 260)",
      accent: "oklch(0.74 0.005 260)",
      accentFg: "oklch(0.18 0.004 260)",
      hue: "260",
    }),
    light: lightVars({
      primary: "oklch(0.24 0.004 260)",
      primaryGlow: "oklch(0.34 0.005 260)",
      primaryFg: "oklch(0.99 0.001 260)",
      accent: "oklch(0.5 0.005 260)",
      accentFg: "oklch(0.99 0.001 260)",
      hue: "260",
    }),
  },
  {
    id: "luxury-gold",
    name: "ذهب فاخر",
    swatch: ["#0d0d0d", "#e8b93c", "#fff2c2"],
    dark: darkVars({
      bg: "oklch(0.15 0.004 85)",
      card: "oklch(0.21 0.008 85)",
      primary: "oklch(0.82 0.15 88)",
      primaryGlow: "oklch(0.9 0.13 92)",
      primaryFg: "oklch(0.16 0.03 88)",
      accent: "oklch(0.9 0.09 95)",
      accentFg: "oklch(0.18 0.03 95)",
      hue: "85",
    }),
    light: lightVars({
      primary: "oklch(0.66 0.15 88)",
      primaryGlow: "oklch(0.76 0.14 92)",
      primaryFg: "oklch(0.15 0.03 88)",
      accent: "oklch(0.5 0.02 85)",
      accentFg: "oklch(0.99 0.01 85)",
      hue: "85",
    }),
  },
];

export const DEFAULT_THEME: ThemeId = "neon-cyber";

export function getPreset(id: string): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function applyTheme(id: ThemeId, mode: Mode) {
  if (typeof document === "undefined") return;
  const preset = getPreset(id);
  const vars = mode === "light" ? preset.light : preset.dark;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.classList.toggle("light", mode === "light");
  root.classList.toggle("dark", mode === "dark");
  root.dataset["theme"] = id;
}
