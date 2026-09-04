import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2, Mail, Phone, UserCog } from "lucide-react";
import { toast } from "sonner";
import { updateMyEmail, updateMyPassword, updateMyPhone } from "@/lib/account.functions";

const inp =
  "h-10 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary";

type Kind = "email" | "phone" | "password";

/**
 * Account tab: update email / phone / password with a 3-field verification form
 * (current, new, confirm new). No OTP or magic links are involved: the server
 * checks the current value against the database before committing the change.
 */
export function AccountPanel() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<Kind | null>(null);

  const [emailForm, setEmailForm] = useState({ current: "", next: "", confirm: "" });
  const [phoneForm, setPhoneForm] = useState({ current: "", next: "", confirm: "" });
  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });

  /** Re-read the authoritative values from the Auth server (never from local state). */
  const reload = async () => {
    await supabase.auth.refreshSession().catch(() => {});
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? "");
    setPhone(data.user?.phone ? `+${data.user.phone.replace(/^\+/, "")}` : "");
  };

  useEffect(() => {
    void reload();
  }, []);

  const run = async (kind: Kind, fn: () => Promise<unknown>) => {
    setBusy(kind);
    try {
      await fn();
      if (kind === "email") {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.error) throw refreshed.error;
      }
      await reload();
      if (kind === "email") setEmailForm({ current: "", next: "", confirm: "" });
      if (kind === "phone") setPhoneForm({ current: "", next: "", confirm: "" });
      if (kind === "password") setPassForm({ current: "", next: "", confirm: "" });
      toast.success("تم الحفظ بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إتمام العملية");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl glass p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <UserCog className="size-4 text-primary" /> بيانات الحساب
        </div>
        <div className="text-xs text-muted-foreground" dir="ltr">
          {email || "—"} {phone ? `• ${phone}` : ""}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("email", () =>
            updateMyEmail({
              data: {
                currentEmail: emailForm.current,
                newEmail: emailForm.next,
                confirmEmail: emailForm.confirm,
              },
            }),
          );
        }}
        className="rounded-2xl glass p-3 space-y-2"
      >
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Mail className="size-4 text-primary" /> تغيير البريد الإلكتروني
        </div>
        <input
          value={emailForm.current}
          onChange={(e) => setEmailForm((f) => ({ ...f, current: e.target.value }))}
          type="email"
          dir="ltr"
          placeholder="البريد الحالي"
          className={inp}
          required
        />
        <input
          value={emailForm.next}
          onChange={(e) => setEmailForm((f) => ({ ...f, next: e.target.value }))}
          type="email"
          dir="ltr"
          placeholder="البريد الجديد"
          className={inp}
          required
        />
        <input
          value={emailForm.confirm}
          onChange={(e) => setEmailForm((f) => ({ ...f, confirm: e.target.value }))}
          type="email"
          dir="ltr"
          placeholder="تأكيد البريد الجديد"
          className={inp}
          required
        />
        <button
          disabled={busy !== null}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          {busy === "email" && <Loader2 className="size-4 animate-spin" />} حفظ البريد
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("phone", () =>
            updateMyPhone({
              data: {
                currentPhone: phoneForm.current,
                newPhone: phoneForm.next,
                confirmPhone: phoneForm.confirm,
              },
            }),
          );
        }}
        className="rounded-2xl glass p-3 space-y-2"
      >
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Phone className="size-4 text-primary" /> تغيير رقم الهاتف
        </div>
        <input
          value={phoneForm.current}
          onChange={(e) => setPhoneForm((f) => ({ ...f, current: e.target.value }))}
          dir="ltr"
          placeholder="الرقم الحالي (اتركه فارغاً إن لم يوجد)"
          className={inp}
        />
        <input
          value={phoneForm.next}
          onChange={(e) => setPhoneForm((f) => ({ ...f, next: e.target.value }))}
          dir="ltr"
          placeholder="الرقم الجديد"
          className={inp}
          required
        />
        <input
          value={phoneForm.confirm}
          onChange={(e) => setPhoneForm((f) => ({ ...f, confirm: e.target.value }))}
          dir="ltr"
          placeholder="تأكيد الرقم الجديد"
          className={inp}
          required
        />
        <button
          disabled={busy !== null}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          {busy === "phone" && <Loader2 className="size-4 animate-spin" />} حفظ الرقم
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run("password", () =>
            updateMyPassword({
              data: {
                currentPassword: passForm.current,
                newPassword: passForm.next,
                confirmPassword: passForm.confirm,
              },
            }),
          );
        }}
        className="rounded-2xl glass p-3 space-y-2"
      >
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <KeyRound className="size-4 text-primary" /> تغيير كلمة المرور
        </div>
        <input
          value={passForm.current}
          onChange={(e) => setPassForm((f) => ({ ...f, current: e.target.value }))}
          type="password"
          dir="ltr"
          placeholder="كلمة المرور الحالية"
          className={inp}
          required
        />
        <input
          value={passForm.next}
          onChange={(e) => setPassForm((f) => ({ ...f, next: e.target.value }))}
          type="password"
          dir="ltr"
          placeholder="كلمة المرور الجديدة"
          className={inp}
          required
        />
        <input
          value={passForm.confirm}
          onChange={(e) => setPassForm((f) => ({ ...f, confirm: e.target.value }))}
          type="password"
          dir="ltr"
          placeholder="تأكيد كلمة المرور الجديدة"
          className={inp}
          required
        />
        <button
          disabled={busy !== null}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          {busy === "password" && <Loader2 className="size-4 animate-spin" />} حفظ كلمة المرور
        </button>
      </form>
    </div>
  );
}
