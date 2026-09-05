import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMERGENCY_CODE = "652004";

function normalizePhone(v: string) {
  const digits = String(v ?? "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+213${digits.slice(1)}`;
  return `+${digits}`;
}

const onlyDigits = (v: string) => String(v ?? "").replace(/\D/g, "");

/** Publishable (anon) client used only to verify a password by signing in. */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Update the signed-in staff member's email after verifying the current one. */
export const updateMyEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { currentEmail: string; newEmail: string; confirmEmail: string }) => {
    const currentEmail = String(input?.currentEmail ?? "").trim().toLowerCase();
    const newEmail = String(input?.newEmail ?? "").trim().toLowerCase();
    const confirmEmail = String(input?.confirmEmail ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) throw new Error("البريد الجديد غير صالح");
    if (newEmail !== confirmEmail) throw new Error("البريد الجديد وتأكيده غير متطابقين");
    return { currentEmail, newEmail };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const saved = (me?.user?.email ?? "").toLowerCase();
    if (!saved || saved !== data.currentEmail) throw new Error("البريد الحالي غير صحيح");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      email: data.newEmail,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { error: directoryError } = await supabaseAdmin
      .from("user_roles")
      .update({ email: data.newEmail })
      .eq("user_id", context.userId);
    if (directoryError) throw new Error(directoryError.message);

    const { data: fresh } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if ((fresh?.user?.email ?? "").toLowerCase() !== data.newEmail) {
      throw new Error("تعذّر حفظ البريد الإلكتروني، حاول مرة أخرى");
    }
    return { ok: true, email: data.newEmail };
  });

/** Update the signed-in staff member's phone after verifying the current one. */
export const updateMyPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { currentPhone: string; newPhone: string; confirmPhone: string }) => {
    const newPhone = normalizePhone(input?.newPhone ?? "");
    const confirmPhone = normalizePhone(input?.confirmPhone ?? "");
    if (onlyDigits(newPhone).length < 9) throw new Error("رقم الهاتف الجديد غير صالح");
    if (newPhone !== confirmPhone) throw new Error("الرقم الجديد وتأكيده غير متطابقين");
    return { currentPhone: normalizePhone(input?.currentPhone ?? ""), newPhone };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const saved = onlyDigits(me?.user?.phone ?? "");
    // When a phone is already linked, the provided current value must match it.
    if (saved && saved !== onlyDigits(data.currentPhone)) throw new Error("رقم الهاتف الحالي غير صحيح");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      phone: data.newPhone,
      phone_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { data: fresh } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const now = onlyDigits(fresh?.user?.phone ?? "");
    if (now !== onlyDigits(data.newPhone)) throw new Error("تعذّر حفظ رقم الهاتف، حاول مرة أخرى");
    return { ok: true, phone: `+${now}` };
  });

/** Update the signed-in staff member's password after verifying the current one. */
export const updateMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const currentPassword = String(input?.currentPassword ?? "");
    const newPassword = String(input?.newPassword ?? "");
    const confirmPassword = String(input?.confirmPassword ?? "");
    if (newPassword.length < 6) throw new Error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
    if (newPassword !== confirmPassword) throw new Error("كلمة المرور الجديدة وتأكيدها غير متطابقين");
    if (!currentPassword) throw new Error("أدخل كلمة المرور الحالية");
    return { currentPassword, newPassword };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = me?.user?.email ?? "";
    const phone = me?.user?.phone ?? "";

    const anon = publicClient();
    const attempt = email
      ? await anon.auth.signInWithPassword({ email, password: data.currentPassword })
      : await anon.auth.signInWithPassword({ phone: `+${onlyDigits(phone)}`, password: data.currentPassword });
    if (attempt.error || !attempt.data?.user) throw new Error("كلمة المرور الحالية غير صحيحة");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);

    // Confirm the new password actually works before reporting success.
    const verify = email
      ? await anon.auth.signInWithPassword({ email, password: data.newPassword })
      : await anon.auth.signInWithPassword({ phone: `+${onlyDigits(phone)}`, password: data.newPassword });
    if (verify.error) throw new Error("تعذّر حفظ كلمة المرور، حاول مرة أخرى");
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
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from("owner_accounts")
      .select("user_id")
      .limit(1)
      .maybeSingle();
    if (ownerError || !owner?.user_id) throw new Error("تعذّر العثور على حساب المالك");
    const { data: ownerUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(owner.user_id);
    const ownerEmail = ownerUser?.user?.email;
    if (userError || !ownerEmail) throw new Error("حساب المالك لا يحتوي على بريد إلكتروني");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: ownerEmail,
    });
    if (error || !link?.properties?.hashed_token) {
      throw new Error(error?.message ?? "تعذّر إنشاء جلسة الطوارئ");
    }
    return { tokenHash: link.properties.hashed_token };
  });
