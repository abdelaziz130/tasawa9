// Estimated delivery windows (hours) per wilaya code, home vs desk.
const FAST = new Set([16, 9, 42, 35, 10]); // Alger, Blida, Tipaza, Boumerdes, Bouira
const MEDIUM = new Set([31, 15, 6, 19, 25, 21, 5, 34, 26, 27, 14, 22, 13, 23, 24, 44, 18, 36, 43, 46, 48, 20, 29]);

export function estimateDelivery(wilayaCode: number, deliveryType: string): string {
  const isDesk = deliveryType.includes("مكتب");
  if (FAST.has(wilayaCode)) return isDesk ? "خلال 24 ساعة" : "خلال 24 - 48 ساعة";
  if (MEDIUM.has(wilayaCode)) return isDesk ? "خلال 48 ساعة" : "خلال 48 - 72 ساعة";
  return isDesk ? "خلال 3 - 4 أيام" : "خلال 3 - 5 أيام";
}
