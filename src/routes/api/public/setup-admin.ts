import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "chaib.aziz2004@gmail.com";
const ADMIN_PASSWORD = "3aziz.1";

export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: owner } = await supabaseAdmin
          .from("owner_accounts")
          .select("user_id")
          .limit(1)
          .maybeSingle();
        if (owner?.user_id) {
          return Response.json({ ok: true, created: false });
        }
        // List users and find match
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (listErr) {
          return new Response(JSON.stringify({ ok: false, error: listErr.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        const existing = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
        if (existing) {
          return Response.json({ ok: true, created: false });
        }
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
        });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        if (!created.user) {
          return Response.json({ ok: false, error: "Admin account was not created" }, { status: 500 });
        }
        const { error: ownerError } = await supabaseAdmin
          .from("owner_accounts")
          .insert({ user_id: created.user.id });
        if (ownerError) {
          return Response.json({ ok: false, error: ownerError.message }, { status: 500 });
        }
        return Response.json({ ok: true, created: true });
      },
    },
  },
});
