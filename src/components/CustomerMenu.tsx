import { useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  X,
  Palette,
  Bot,
  Download,
  Check,
  Share,
  Plus,
  ChevronLeft,
  Smartphone,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { THEMES } from "@/lib/themes";
import { usePwaInstall } from "@/lib/pwa";
import { useChatUI } from "@/lib/chat-ui";
import { toast } from "sonner";

type Panel = "root" | "appearance";

export function CustomerMenu() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("root");
  const [iosGuide, setIosGuide] = useState(false);
  const { theme, mode, setTheme, setMode } = useTheme();
  const pwa = usePwaInstall();
  const chat = useChatUI();

  const close = () => {
    setOpen(false);
    setPanel("root");
  };

  const install = async () => {
    if (pwa.installed) {
      toast.info("التطبيق مثبّت بالفعل");
      return;
    }
    if (pwa.platform === "ios") {
      setIosGuide(true);
      close();
      return;
    }
    if (pwa.canPrompt) {
      const r = await pwa.install();
      if (r === "accepted") toast.success("تم تثبيت التطبيق");
      close();
      return;
    }
    toast.info("افتح قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق»");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="القائمة"
        className="grid size-10 place-items-center rounded-2xl glass transition hover:bg-primary/10"
      >
        <MoreVertical className="size-5" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl glass-strong sm:max-w-md sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
              {panel === "root" ? (
                <h2 className="text-lg font-extrabold">القائمة</h2>
              ) : (
                <button
                  onClick={() => setPanel("root")}
                  className="flex items-center gap-1 text-sm font-extrabold"
                >
                  <ChevronLeft className="size-4 rotate-180" />
                  المظهر والثيمات
                </button>
              )}
              <button
                onClick={close}
                aria-label="إغلاق"
                className="grid size-9 shrink-0 place-items-center rounded-xl glass hover:bg-primary/10"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {panel === "root" && (
                <div className="space-y-2">
                  <Row
                    icon={<Bot className="size-5" />}
                    title="مساعد الذكاء الاصطناعي"
                    desc="اسأل عن التوصيل، الأسعار وطريقة الطلب"
                    onClick={() => {
                      chat.setOpen(true);
                      close();
                    }}
                  />
                  <Row
                    icon={<Palette className="size-5" />}
                    title="المظهر والثيمات"
                    desc="6 ثيمات + الوضع الداكن والفاتح (على هذا الجهاز)"
                    onClick={() => setPanel("appearance")}
                  />
                  <Row
                    icon={<Download className="size-5" />}
                    title={pwa.installed ? "التطبيق مثبّت" : "تثبيت التطبيق"}
                    desc="يعمل على أندرويد، آيفون والكمبيوتر"
                    onClick={install}
                  />
                </div>
              )}

              {panel === "appearance" && (
                <div className="space-y-4">
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
                  <div className="space-y-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as typeof theme)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-right transition ${
                          theme === t.id ? "glass-strong ring-2 ring-primary" : "glass"
                        }`}
                      >
                        <div className="flex shrink-0 gap-1">
                          {t.swatch.map((c) => (
                            <span
                              key={c}
                              className="size-6 rounded-lg border border-white/10"
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        <span className="flex-1 text-sm font-bold">{t.name}</span>
                        {theme === t.id && <Check className="size-4 shrink-0 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3 text-center text-[11px] font-semibold text-muted-foreground">
              جميع الحقوق محفوظة © تسوق | Tasawa9
            </div>
          </div>
        </div>,
        document.body,
      )}

      {iosGuide && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIosGuide(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl glass-strong p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Smartphone className="size-5" />
              </span>
              <h3 className="font-extrabold">إضافة التطبيق على آيفون</h3>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg btn-primary text-xs font-black">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  اضغط زر المشاركة <Share className="size-4 text-primary" /> في شريط سفاري السفلي
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg btn-primary text-xs font-black">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  اختر <Plus className="size-4 text-primary" /> «الإضافة إلى الشاشة الرئيسية»
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg btn-primary text-xs font-black">
                  3
                </span>
                <span>اضغط «إضافة» — وسيظهر التطبيق على شاشتك</span>
              </li>
            </ol>
            <button
              onClick={() => setIosGuide(false)}
              className="mt-4 h-11 w-full rounded-2xl btn-primary font-extrabold"
            >
              فهمت
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function Row({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl glass p-3 text-right transition hover:bg-primary/10"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{desc}</span>
      </span>
      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
