import { DEFAULT_WHATSAPP } from "@/lib/settings";

export const WHATSAPP_NUMBER = DEFAULT_WHATSAPP;

function normalize(n: string) {
  return n.replace(/[^\d]/g, "").replace(/^0/, "213");
}

export function waLink(text: string, number?: string) {
  return `https://wa.me/${normalize(number || WHATSAPP_NUMBER)}?text=${encodeURIComponent(text)}`;
}

export function customerWaLink(phone: string, text: string) {
  return `https://wa.me/${normalize(phone)}?text=${encodeURIComponent(text)}`;
}
