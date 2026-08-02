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
  .inputValidator((input: { email: string; password: string; role?: "admin" | "sub_admin" }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    const password = String(input?.password ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("البريد غير صالح");
    if (password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    const role: "admin" | "sub_admin" = input.role === "admin" ? "admin" : "sub_admin";
    return { email, password, role };

  })
  .handler(async ({ data, context }) => {
    assertOwner(context.claims as Record<string, unknown>);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (created.data?.user) userId = created.data.user.id;
    else {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users?.find((u) => u.email?.toLowerCase() === data.email);
      if (!found) throw new Error(created.error?.message ?? "تعذّر إنشاء الحساب");
      userId = found.id;
      await supabaseAdmin.auth.admin.updateUserById(found.id, { password: data.password });
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, email: data.email, role: data.role },
        { onConflict: "user_id,role" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, userId };
  });

/** Revoke an employee's access. Owner-admin only. */
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
