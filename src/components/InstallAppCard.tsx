import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, Plus, Share, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";
import { toast } from "sonner";

/**
 * Visible "install as app" card on the storefront page so customers can add
 * Tasawa9 to their home screen as a standalone app without opening any menu.
 */
export function InstallAppCard() {
  const pwa = usePwaInstall();
  const [iosGuide, setIosGuide] = useState(false);

  if (pwa.installed) return null;

  const install = async () => {
    if (pwa.platform === "ios") {
      setIosGuide(true);
      return;
    }
    if (pwa.canPrompt) {
      const r = await pwa.install();
      if (r === "accepted") toast.success("تم تثبيت التطبيق");
      return;
    }
    toast.info("افتح قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق»");
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl glass p-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Smartphone className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold">حمّل تطبيق تسوق على هاتفك</div>
            <div className="text-[11px] text-muted-foreground">
              تطبيق مستقل يعمل على أندرويد، آيفون والكمبيوتر
            </div>
          </div>
        </div>
        <button
          onClick={install}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl btn-primary px-4 text-sm font-extrabold"
        >
          <Download className="size-4" /> تثبيت
        </button>
      </div>

      {iosGuide &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIosGuide(false)}
            />
            <div className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl glass-strong p-5">
              <h3 className="mb-3 font-extrabold">إضافة التطبيق على آيفون</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg btn-primary text-xs font-black">
                    1
                  </span>
                  <span className="flex items-center gap-1.5">
                    اضغط زر المشاركة <Share className="size-4 text-primary" /> في سفاري
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
                className="mt-4 h-12 w-full rounded-2xl btn-primary font-extrabold"
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
