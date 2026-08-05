import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2, Mail, Phone, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

type Pending =
  | { kind: "email"; value: string }
  | { kind: "password"; value: string }
  | null;

const inp =
  "h-10 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus:border-primary";

function normalizePhone(v: string) {
  const digits = v.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+213${digits.slice(1)}`;
  return `+${digits}`;
}

/** Account tab: view + update email / phone / password (email & password need an OTP code). */
export function AccountPanel() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? "");
      setEmail(data.user?.email ?? "");
      setPhone(data.user?.phone ?? "");
    });
  }, []);

  const sendCode = async (next: Pending) => {
    if (!currentEmail) return toast.error("لا يوجد بريد مرتبط بالحساب");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: currentEmail,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPending(next);
    setOtp("");
    toast.success("تم إرسال رمز من 6 أرقام إلى بريدك الحالي");
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    const code = otp.replace(/[^\d]/g, "");
    if (code.length !== 6) return toast.error("الرمز يجب أن يكون 6 أرقام");
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: code,
      type: "email",
    });
    if (error) {
      setBusy(false);
      return toast.error("الرمز غير صحيح أو منتهي");
    }
    const payload =
      pending.kind === "email" ? { email: pending.value } : { password: pending.value };
    const { error: upErr } = await supabase.auth.updateUser(payload);
    setBusy(false);
    if (upErr) return toast.error(upErr.message);
    toast.success(
      pending.kind === "email"
        ? "تم إرسال رابط/رمز تأكيد البريد الجديد"
        : "تم تحديث كلمة المرور",
    );
    setPending(null);
    setOtp("");
    setNewEmail("");
    setNewPass("");
  };

  const savePhone = async () => {
    const p = normalizePhone(phone);
    if (!p) return toast.error("أدخل رقم هاتف صحيح");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ phone: p });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث رقم الهاتف");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl glass p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <UserCog className="size-4 text-primary" /> بيانات الحساب
        </div>
        <div className="text-xs text-muted-foreground" dir="ltr">
          {email || "—"}
        </div>
      </div>

      <div className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Phone className="size-4 text-primary" /> رقم الهاتف
        </div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          dir="ltr"
          placeholder="0782524124"
          className={inp}
        />
        <button
          onClick={savePhone}
          disabled={busy}
          className="h-10 w-full rounded-xl glass text-sm font-extrabold disabled:opacity-60"
        >
          حفظ الهاتف
        </button>
      </div>

      <div className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <Mail className="size-4 text-primary" /> تغيير البريد الإلكتروني
        </div>
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
          dir="ltr"
          placeholder="new@email.com"
          className={inp}
        />
        <button
          onClick={() => {
            if (!newEmail.includes("@")) return toast.error("أدخل بريداً صحيحاً");
            void sendCode({ kind: "email", value: newEmail.trim() });
          }}
          disabled={busy}
          className="h-10 w-full rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          إرسال رمز التحقق
        </button>
      </div>

      <div className="rounded-2xl glass p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold">
          <KeyRound className="size-4 text-primary" /> تغيير كلمة المرور
        </div>
        <input
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          type="password"
          dir="ltr"
          placeholder="كلمة مرور جديدة"
          className={inp}
        />
        <button
          onClick={() => {
            if (newPass.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            void sendCode({ kind: "password", value: newPass });
          }}
          disabled={busy}
          className="h-10 w-full rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
        >
          إرسال رمز التحقق
        </button>
      </div>

      {pending && (
        <form onSubmit={confirm} className="rounded-2xl glass p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-extrabold">
            <ShieldCheck className="size-4 text-primary" /> تأكيد العملية
          </div>
          <p className="text-xs text-muted-foreground">
            أدخل الرمز المُرسل إلى <span dir="ltr">{currentEmail}</span>
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            dir="ltr"
            placeholder="000000"
            className={`${inp} text-center tracking-[0.4em]`}
            required
          />
          <button
            disabled={busy}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl btn-primary text-sm font-extrabold disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} تأكيد
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="h-9 w-full rounded-xl text-xs font-bold text-muted-foreground"
          >
            إلغاء
          </button>
        </form>
      )}
    </div>
  );
}
