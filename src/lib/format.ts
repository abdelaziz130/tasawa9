export function formatDZD(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!isFinite(n)) return "0 دج";
  return `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(n)} دج`;
}
