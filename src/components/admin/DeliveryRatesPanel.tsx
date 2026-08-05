import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COMMUNES } from "@/lib/communes";
import { ChevronDown, Loader2, Save, Truck } from "lucide-react";
import { toast } from "sonner";

type WilayaRate = {
  id: string;
  wilaya_code: number;
  wilaya_name: string;
  home_fee: number;
  desk_fee: number;
};

type CommuneRate = {
  id: string;
  wilaya_code: number;
  commune_name: string;
  home_fee: number;
  desk_fee: number;
};

const inp =
  "h-9 w-full min-w-0 rounded-xl border border-border bg-input px-2 text-center text-xs font-bold outline-none focus:border-primary";

export function DeliveryRatesPanel() {
  const qc = useQueryClient();
  const [openCode, setOpenCode] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, { home: string; desk: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data: wilayas, isLoading } = useQuery({
    queryKey: ["wilayas_shipping_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wilayas_shipping")
        .select("*")
        .order("wilaya_code");
      if (error) throw error;
      return (data ?? []) as WilayaRate[];
    },
  });

  const { data: communeRates } = useQuery({
    queryKey: ["communes_shipping_admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communes_shipping").select("*");
      if (error) throw error;
      return (data ?? []) as CommuneRate[];
    },
  });

  const communeMap = useMemo(() => {
    const m = new Map<string, CommuneRate>();
    for (const r of communeRates ?? []) m.set(`${r.wilaya_code}|${r.commune_name}`, r);
    return m;
  }, [communeRates]);

  const list = useMemo(() => {
    const q = search.trim();
    return (wilayas ?? []).filter(
      (w) => !q || w.wilaya_name.includes(q) || String(w.wilaya_code).includes(q),
    );
  }, [wilayas, search]);

  const val = (key: string, fallbackHome: number, fallbackDesk: number) =>
    draft[key] ?? { home: String(fallbackHome), desk: String(fallbackDesk) };

  const setVal = (key: string, patch: { home?: string; desk?: string }, base: { home: string; desk: string }) =>
    setDraft((d) => ({ ...d, [key]: { ...base, ...(d[key] ?? {}), ...patch } }));

  const saveWilaya = async (w: WilayaRate) => {
    const key = `w${w.wilaya_code}`;
    const v = val(key, w.home_fee, w.desk_fee);
    setBusy(key);
    const { error } = await supabase
      .from("wilayas_shipping")
      .update({ home_fee: Number(v.home) || 0, desk_fee: Number(v.desk) || 0 })
      .eq("id", w.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`تم حفظ أسعار ولاية ${w.wilaya_name}`);
    qc.invalidateQueries({ queryKey: ["wilayas_shipping_admin"] });
    qc.invalidateQueries({ queryKey: ["wilayas_shipping"] });
  };

  const saveCommune = async (w: WilayaRate, commune: string) => {
    const key = `c${w.wilaya_code}|${commune}`;
    const existing = communeMap.get(`${w.wilaya_code}|${commune}`);
    const v = val(key, existing?.home_fee ?? w.home_fee, existing?.desk_fee ?? w.desk_fee);
    setBusy(key);
    const { error } = await supabase.from("communes_shipping").upsert(
      {
        wilaya_code: w.wilaya_code,
        commune_name: commune,
        home_fee: Number(v.home) || 0,
        desk_fee: Number(v.desk) || 0,
      },
      { onConflict: "wilaya_code,commune_name" },
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`تم حفظ أسعار بلدية ${commune}`);
    qc.invalidateQueries({ queryKey: ["communes_shipping_admin"] });
    qc.invalidateQueries({ queryKey: ["communes_shipping"] });
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Truck className="size-4 text-primary" /> أسعار التوصيل (58 ولاية + البلديات)
        </div>
        <p className="text-xs text-muted-foreground">
          حدّد سعر التوصيل للمنزل والمكتب لكل ولاية، وافتح الولاية لتعديل سعر بلدية معيّنة.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن ولاية..."
          className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <ul className="space-y-2">
        {list.map((w) => {
          const wKey = `w${w.wilaya_code}`;
          const wv = val(wKey, w.home_fee, w.desk_fee);
          const communes = COMMUNES[w.wilaya_code] ?? [];
          const expanded = openCode === w.wilaya_code;
          return (
            <li key={w.id} className="rounded-2xl glass p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpenCode(expanded ? null : w.wilaya_code)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-right"
                >
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}
                  />
                  <span className="truncate text-sm font-extrabold">
                    {String(w.wilaya_code).padStart(2, "0")} - {w.wilaya_name}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {communes.length} بلدية
                  </span>
                </button>
              </div>

              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                <label className="space-y-1">
                  <span className="block text-[10px] font-bold text-muted-foreground">للمنزل</span>
                  <input
                    value={wv.home}
                    inputMode="numeric"
                    onChange={(e) => setVal(wKey, { home: e.target.value }, wv)}
                    className={inp}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] font-bold text-muted-foreground">للمكتب</span>
                  <input
                    value={wv.desk}
                    inputMode="numeric"
                    onChange={(e) => setVal(wKey, { desk: e.target.value }, wv)}
                    className={inp}
                  />
                </label>
                <button
                  onClick={() => saveWilaya(w)}
                  disabled={busy === wKey}
                  className="mt-4 grid size-9 place-items-center rounded-xl btn-primary disabled:opacity-60"
                  aria-label="حفظ"
                >
                  {busy === wKey ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                </button>
              </div>

              {expanded && (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto border-t border-border pt-3">
                  {communes.map((cn) => {
                    const cKey = `c${w.wilaya_code}|${cn}`;
                    const ex = communeMap.get(`${w.wilaya_code}|${cn}`);
                    const cv = val(cKey, ex?.home_fee ?? w.home_fee, ex?.desk_fee ?? w.desk_fee);
                    return (
                      <li
                        key={cn}
                        className="grid grid-cols-[1fr_70px_70px_auto] items-center gap-2"
                      >
                        <span className="truncate text-xs font-bold">
                          {cn}
                          {ex && (
                            <span className="ms-1 text-[9px] font-extrabold text-primary">مخصّص</span>
                          )}
                        </span>
                        <input
                          value={cv.home}
                          inputMode="numeric"
                          onChange={(e) => setVal(cKey, { home: e.target.value }, cv)}
                          className={inp}
                        />
                        <input
                          value={cv.desk}
                          inputMode="numeric"
                          onChange={(e) => setVal(cKey, { desk: e.target.value }, cv)}
                          className={inp}
                        />
                        <button
                          onClick={() => saveCommune(w, cn)}
                          disabled={busy === cKey}
                          className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary disabled:opacity-60"
                          aria-label="حفظ البلدية"
                        >
                          {busy === cKey ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Save className="size-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
