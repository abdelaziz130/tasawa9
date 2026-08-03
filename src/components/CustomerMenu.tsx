import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MoreVertical,
  X,
  Palette,
  Bot,
  Settings,
  Download,
  Check,
  Share,
  Plus,
  ChevronLeft,
  Truck,
  PhoneCall,
  Smartphone,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { THEMES } from "@/lib/themes";
import { usePwaInstall } from "@/lib/pwa";
import { useChatUI } from "@/lib/chat-ui";
import { useStoreSettings, useWhatsAppNumber } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { toast } from "sonner";

type Panel = "root" | "appearance" | "settings";

export function CustomerMenu() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("root");
  const [iosGuide, setIosGuide] = useState(false);
  const { theme, mode, setTheme, setMode } = useTheme();
  const pwa = usePwaInstall();
  const chat = useChatUI();
  const { data: settings } = useStoreSettings();
  const waNumber = useWhatsAppNumber();

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

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl glass-strong p-4 sm:max-w-md sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              {panel === "root" ? (
                <h2 className="text-lg font-extrabold">القائمة</h2>
              ) : (
                <button
                  onClick={() => setPanel("root")}
                  className="flex items-center gap-1 text-sm font-extrabold"
                >
                  <ChevronLeft className="size-4 rotate-180" />
                  {panel === "appearance" ? "المظهر والثيمات" : "الإعدادات"}
                </button>
              )}
              <button
                onClick={close}
                aria-label="إغلاق"
                className="grid size-9 place-items-center rounded-xl hover:bg-primary/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {panel === "root" && (
              <div className="space-y-2">
                <Row
                  icon={<Palette className="size-5" />}
                  title="المظهر والثيمات"
                  desc="اختر من 6 ثيمات وبين الوضع الداكن والفاتح"
                  onClick={() => setPanel("appearance")}
                />
                <Row
                  icon={<Bot className="size-5" />}
                  title="المساعد الذكي"
                  desc="اسأل عن التوصيل، الأسعار وطريقة الطلب"
                  onClick={() => {
                    chat.setOpen(true);
                    close();
                  }}
                />
                <Row
                  icon={<Settings className="size-5" />}
                  title="الإعدادات"
                  desc="تتبع الطلب، معلومات المتجر والتواصل"
                  onClick={() => setPanel("settings")}
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

            {panel === "settings" && (
              <div className="space-y-2">
                <div className="rounded-2xl glass p-3">
                  <div className="text-xs font-bold text-muted-foreground">المتجر</div>
                  <div className="mt-1 text-sm font-extrabold">
                    {settings?.store_name || "تسوق | Tasawa9"}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    الدفع عند الاستلام • توصيل لجميع 58 ولاية
                  </p>
                </div>
                <Link
                  to="/thank-you"
                  onClick={close}
                  className="flex items-center gap-3 rounded-2xl glass p-3 text-right"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Truck className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">تتبع طلبي</span>
                    <span className="block text-[11px] text-muted-foreground">
                      عرض تفاصيل وحالة آخر طلب
                    </span>
                  </span>
                </Link>
                <a
                  href={waLink("مرحباً، أود الاستفسار", waNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl glass p-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                    <PhoneCall className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">خدمة العملاء</span>
                    <span className="block text-[11px] text-muted-foreground" dir="ltr">
                      +{waNumber}
                    </span>
                  </span>
                </a>
                <div className="rounded-2xl glass p-3">
                  <div className="text-xs font-bold text-muted-foreground">اللغة</div>
                  <div className="mt-2 flex gap-2">
                    <span className="h-9 flex-1 grid place-items-center rounded-xl btn-primary text-xs font-extrabold">
                      العربية
                    </span>
                    <span className="h-9 flex-1 grid place-items-center rounded-xl glass text-xs font-bold text-muted-foreground">
                      Français (قريباً)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {iosGuide && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIosGuide(false)} />
          <div className="relative w-full max-w-sm rounded-3xl glass-strong p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Smartphone className="size-5" />
              </span>
              <h3 className="font-extrabold">إضافة التطبيق على آيفون</h3>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg btn-primary text-xs font-black">1</span>
                <span className="flex items-center gap-1.5">
                  اضغط زر المشاركة <Share className="size-4 text-primary" /> في شريط سفاري السفلي
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg btn-primary text-xs font-black">2</span>
                <span className="flex items-center gap-1.5">
                  اختر <Plus className="size-4 text-primary" /> «الإضافة إلى الشاشة الرئيسية»
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg btn-primary text-xs font-black">3</span>
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
        </div>
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
