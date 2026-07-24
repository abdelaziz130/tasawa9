import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_banner_dismissed_v1";

export function PWAInstallBanner() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {}
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt as EventListener);
  }, []);

  if (!visible || !evt) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setVisible(false);
  };

  const install = async () => {
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  return (
    <div className="fixed bottom-24 inset-x-3 z-40 mx-auto max-w-md glass-strong rounded-2xl p-3 flex items-center gap-3 shadow-2xl border border-primary/30 animate-in slide-in-from-bottom-4">
      <div className="grid size-10 place-items-center rounded-xl btn-primary shrink-0">
        <Download className="size-5" />
      </div>
      <div className="flex-1 text-sm">
        <div className="font-extrabold">أضف المتجر لشاشتك الرئيسية</div>
        <div className="text-xs text-muted-foreground">تجربة أسرع وأسهل عند الطلب</div>
      </div>
      <button
        onClick={install}
        className="h-9 px-3 rounded-xl btn-primary text-xs font-extrabold"
      >
        تثبيت
      </button>
      <button
        onClick={dismiss}
        aria-label="إغلاق"
        className="size-8 grid place-items-center rounded-lg hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
