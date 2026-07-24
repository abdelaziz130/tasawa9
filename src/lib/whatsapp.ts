export const WHATSAPP_NUMBER = "213782524124";

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function customerWaLink(phone: string, text: string) {
  const n = phone.replace(/[^\d]/g, "").replace(/^0/, "213");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
