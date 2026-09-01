import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "chaib.aziz2004@gmail.com";
const EMERGENCY_CODE = "652004";

/** Commit a new phone number for the signed-in staff member (after email-OTP verification). */
export const setMyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => {
    const digits = String(input?.phone ?? "").replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 9) throw new Error("رقم الهاتف غير صالح");
    const phone = digits.startsWith("+")
      ? digits
      : digits.startsWith("0")
        ? `+213${digits.slice(1)}`
        : `+${digits}`;
    return { phone };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      phone: data.phone,
      phone_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true, phone: data.phone };
  });

/** Keep the staff directory row in sync after an auth email change. */
export const syncMyStaffEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("البريد غير صالح");
    return { email };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      email: data.email,
      email_confirm: true,
    });
    await supabaseAdmin.from("user_roles").update({ email: data.email }).eq("user_id", context.userId);
    return { ok: true };
  });

/**
 * Emergency admin access: exchanging the emergency code for a one-time
 * verification token for the owner account. The code is the only gate.
 */
export const emergencyAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: String(input?.code ?? "").trim() }))
  .handler(async ({ data }) => {
    if (data.code !== EMERGENCY_CODE) throw new Error("رمز الطوارئ غير صحيح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ADMIN_EMAIL,
    });
    if (error || !link?.properties?.hashed_token) {
      throw new Error(error?.message ?? "تعذّر إنشاء جلسة الطوارئ");
    }
    return { tokenHash: link.properties.hashed_token };
  });
