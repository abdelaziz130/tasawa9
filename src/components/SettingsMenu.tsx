import { useState } from "react";
import { Settings, Download, X, Check, Share, Plus, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { THEMES } from "@/lib/themes";
import { usePwaInstall } from "@/lib/pwa";
import { toast } from "sonner";

export function SettingsMenu({
  adminMode,
  onSetDefaultTheme,
}: {
  adminMode?: boolean;
  onSetDefaultTheme?: (id: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const [asDefault, setAsDefault] = useState(false);
  const { theme, mode, setTheme, setMode } = useTheme();
  const pwa = usePwaInstall();

  const pickTheme = async (id: string) => {
    setTheme(id as typeof theme);
    if (adminMode && asDefault && onSetDefaultTheme) {
      await onSetDefaultTheme(id);
      toast.success("تم تعيين الثيم كافتراضي لجميع الزوار");
    }
  };

  const doInstall = async () => {
    if (pwa.installed) {
      toast.info("التطبيق مثبّت بالفعل");
      return;
    }
    if (pwa.canPrompt) {
      const r = await pwa.install();
      if (r === "accepted") toast.success("تم تثبيت التطبيق");
      return;
    }
    if (pwa.platform === "ios") {
      setIosGuide(true);
      return;
    }
    toast.info("افتح قائمة المتصفح ثم اختر «تثبيت التطبيق»");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="الإعدادات"
        className="grid size-10 place-items-center rounded-2xl glass hover:bg-primary/10 transition"
      >
        <Settings className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md glass-strong rounded-t-3xl sm:rounded-3xl p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg">الإعدادات</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="size-9 grid place-items-center rounded-xl hover:bg-primary/10"
              >
                <X className="size-5" />
              </button>
            </div>

            <section className="mb-5">
              <div className="text-xs font-bold text-muted-foreground mb-2">المظهر</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("dark")}
                  className={`h-11 rounded-2xl text-sm font-bold ${mode === "dark" ? "btn-primary" : "glass"}`}
                >
                  داكن
                </button>
                <button
                  onClick={() => setMode("light")}
                  className={`h-11 rounded-2xl text-sm font-bold ${mode === "light" ? "btn-primary" : "glass"}`}
                >
                  فاتح
                </button>
              </div>
            </section>

            <section className="mb-5">
              <div className="text-xs font-bold text-muted-foreground mb-2">الثيمات</div>
              <div className="space-y-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pickTheme(t.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl p-2.5 text-right transition ${
                      theme === t.id ? "glass-strong ring-2 ring-primary" : "glass"
                    }`}
                  >
                    <div className="flex gap-1 shrink-0">
                      {t.swatch.map((c) => (
                        <span
                          key={c}
                          className="size-6 rounded-lg border border-white/10"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <span className="flex-1 text-sm font-bold">{t.name}</span>
                    {theme === t.id && <Check className="size-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              {adminMode && (
                <label className="mt-3 flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={asDefault}
                    onChange={(e) => setAsDefault(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  تعيين هذا الثيم كـ (ثيم افتراضي) لجميع الزوار
                </label>
              )}
            </section>

            <section>
              <div className="text-xs font-bold text-muted-foreground mb-2">التطبيق</div>
              <button
                onClick={doInstall}
                className="w-full h-12 rounded-2xl btn-primary font-extrabold flex items-center justify-center gap-2"
              >
                <Download className="size-5" />
                {pwa.installed ? "التطبيق مثبّت" : "تثبيت التطبيق"}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Monitor className="size-3.5 shrink-0" />
                يعمل على أندرويد، آيفون والكمبيوتر
              </p>
            </section>
          </div>
        </div>
      )}

      {iosGuide && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIosGuide(false)} />
          <div className="relative w-full max-w-sm glass-strong rounded-3xl p-5">
            <h3 className="font-extrabold mb-3">إضافة التطبيق على آيفون</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-6 grid place-items-center rounded-lg btn-primary text-xs font-black">1</span>
                <span className="flex items-center gap-1.5">
                  اضغط زر المشاركة <Share className="size-4 text-primary" /> في سفاري
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-6 grid place-items-center rounded-lg btn-primary text-xs font-black">2</span>
                <span className="flex items-center gap-1.5">
                  اختر <Plus className="size-4 text-primary" /> «إضافة إلى الشاشة الرئيسية»
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-6 grid place-items-center rounded-lg btn-primary text-xs font-black">3</span>
                <span>اضغط «إضافة» — وسيظهر التطبيق على شاشتك</span>
              </li>
            </ol>
            <button
              onClick={() => setIosGuide(false)}
              className="mt-4 w-full h-11 rounded-2xl btn-primary font-extrabold"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
