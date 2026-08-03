import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { askChatbot } from "@/lib/chatbot.functions";
import { waLink } from "@/lib/whatsapp";
import { useWhatsAppNumber } from "@/lib/settings";
import { useChatUI } from "@/lib/chat-ui";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: "أهلاً بك 👋 أنا مساعدك الذكي. اسألني عن التوصيل، الأسعار، أو طريقة الطلب.",
};

const SUGGESTIONS = ["كيفاش نطلب؟", "شحال رسوم التوصيل؟", "الدفع عند الاستلام؟"];

export function AIChatWidget() {
  const { open, setOpen } = useChatUI();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askChatbot);

  const number = useWhatsAppNumber();
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next.filter((m) => m !== GREETING) } });
      setMsgs((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error && e.message
              ? `${e.message} — يمكنك التواصل معنا عبر واتساب.`
              : "حدث خطأ، تواصل معنا عبر واتساب.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="مساعد ذكي"
        className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full btn-primary shadow-2xl transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Bot className="size-7" />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-3 z-40 flex h-[26rem] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl glass-strong shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/20 text-primary">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">المساعد الذكي</div>
              <div className="text-[10px] text-muted-foreground">يجيب فوراً على أسئلتك</div>
            </div>
            <a
              href={waLink("مرحباً، عندي سؤال", number)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto grid size-8 place-items-center rounded-xl bg-[#25D366]/20 text-[#25D366]"
              aria-label="واتساب"
            >
              <MessageCircle className="size-4" />
            </a>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-start" : ""}>
                {m.role === "user" ? (
                  <span className="max-w-[85%] rounded-2xl bg-primary px-3 py-2 font-medium text-primary-foreground">
                    {m.content}
                  </span>
                ) : (
                  <p className="max-w-[92%] leading-relaxed text-foreground">{m.content}</p>
                )}
              </div>
            ))}
            {loading && <p className="animate-pulse text-xs text-muted-foreground">يكتب...</p>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full glass px-2.5 py-1 text-[11px] font-semibold hover:border-primary/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border px-3 py-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك..."
              className="h-10 min-w-0 flex-1 rounded-2xl glass px-3 text-sm outline-none focus:ring-2 focus:ring-primary/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="إرسال"
              className="grid size-10 shrink-0 place-items-center rounded-2xl btn-primary disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
