import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "chaib.aziz2004@gmail.com";

function assertOwner(claims: Record<string, unknown> | undefined) {
  const email = String(claims?.["email"] ?? "").toLowerCase();
  if (email !== ADMIN_EMAIL) throw new Error("غير مصرّح لك بهذه العملية");
}

/** Create (or attach) a sub-admin employee account. Owner-admin only. */
export const addStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      identifier: string;
      password: string;
      fullName?: string;
      role?: "admin" | "sub_admin";
    }) => {
      const raw = String(input?.identifier ?? "").trim();
      const password = String(input?.password ?? "");
      const fullName = String(input?.fullName ?? "").trim() || null;
      if (password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      const role: "admin" | "sub_admin" = input.role === "admin" ? "admin" : "sub_admin";

      if (raw.includes("@")) {
        const email = raw.toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("البريد غير صالح");
        return { email, phone: null as string | null, label: email, password, fullName, role };
      }

      const digits = raw.replace(/[^\d+]/g, "");
      if (digits.replace(/\D/g, "").length < 9) throw new Error("رقم الهاتف غير صالح");
      const phone = digits.startsWith("+")
        ? digits
        : digits.startsWith("0")
          ? `+213${digits.slice(1)}`
          : `+${digits}`;
      return { email: null as string | null, phone, label: phone, password, fullName, role };
    },
  )
  .handler(async ({ data, context }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    const created = await supabaseAdmin.auth.admin.createUser(
      data.email
        ? { email: data.email, password: data.password, email_confirm: true }
        : { phone: data.phone!, password: data.password, phone_confirm: true },
    );
    if (created.data?.user) userId = created.data.user.id;
    else {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users?.find((u) =>
        data.email ? u.email?.toLowerCase() === data.email : u.phone === data.phone!.replace("+", ""),
      );
      if (!found) throw new Error(created.error?.message ?? "تعذّر إنشاء الحساب");
      userId = found.id;
      await supabaseAdmin.auth.admin.updateUserById(found.id, { password: data.password });
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          email: data.label,
          full_name: data.fullName,
          role: data.role,
          status: "active",
        },
        { onConflict: "user_id,role" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, userId };
  });

/** Block or unblock an employee: revokes their sessions and blocks login. Owner-admin only. */
export const setStaffStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "active" | "blocked" }) => {
    const id = String(input?.id ?? "").trim();
    if (!id) throw new Error("معرّف مطلوب");
    const status = input?.status === "blocked" ? "blocked" : "active";
    return { id, status };
  })
  .handler(async ({ data, context }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: readErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row?.user_id) throw new Error("الموظف غير موجود");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Revoke the active session and block/allow future logins.
    if (data.status === "blocked") {
      await supabaseAdmin.auth.admin.signOut(row.user_id, "global").catch(() => {});
      await supabaseAdmin.auth.admin.updateUserById(row.user_id, { ban_duration: "876000h" });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(row.user_id, { ban_duration: "none" });
    }
    return { ok: true };
  });

/** Revoke an employee's access entirely. Owner-admin only. */
export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = String(input?.id ?? "").trim();
    if (!id) throw new Error("معرّف مطلوب");
    return { id };
  })
  .handler(async ({ data, context }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

