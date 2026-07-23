import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "213555000000";

export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("مرحباً، أود الاستفسار عن منتج")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="واتساب"
      className="fixed bottom-24 right-4 z-40 grid place-items-center size-14 rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 hover:scale-105 active:scale-95 transition"
    >
      <MessageCircle className="size-7" fill="currentColor" strokeWidth={0} />
      <span className="absolute -top-0.5 -left-0.5 size-3.5 rounded-full bg-[#25D366] animate-ping opacity-60" />
    </a>
  );
}
