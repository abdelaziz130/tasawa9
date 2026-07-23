import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 fade-in duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="grid place-items-center size-9 rounded-full hover:bg-white/10"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
