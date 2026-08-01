import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type ChatMsg = { role: "user" | "assistant"; content: string };

const FALLBACK_KB = `متجر "تسوق | Tasawa9" جزائري. الدفع عند الاستلام فقط. التوصيل لجميع 58 ولاية (للمنزل أو لمكتب التوصيل) خلال 24-72 ساعة حسب الولاية. رسوم التوصيل تحسب تلقائياً حسب الولاية. يمكن إرجاع المنتج إذا كان معطوباً.`;

export const askChatbot = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMsg[] }) => {
    if (!Array.isArray(input?.messages) || input.messages.length === 0) {
      throw new Error("messages required");
    }
    return { messages: input.messages.slice(-12) };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI غير متوفر حالياً");

    let kb = FALLBACK_KB;
    try {
      const url = process.env["SUPABASE_URL"];
      const pub = process.env["SUPABASE_PUBLISHABLE_KEY"];
      if (url && pub) {
        const sb = createClient(url, pub, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (pub.startsWith("sb_") && h.get("Authorization") === `Bearer ${pub}`)
                h.delete("Authorization");
              h.set("apikey", pub);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data: s } = await sb.from("store_settings").select("chatbot_kb").limit(1).maybeSingle();
        if (s?.chatbot_kb) kb = s.chatbot_kb;
      }
    } catch {
      // keep fallback knowledge base
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content: `أنت مساعد خدمة العملاء لمتجر إلكتروني جزائري. أجب دائماً بالعربية الجزائرية البسيطة، بإيجاز (سطرين أو ثلاثة كحد أقصى)، وبأسلوب ودّي يشجع على الشراء. لا تخترع معلومات غير موجودة؛ إذا لم تعرف اطلب من الزبون التواصل عبر واتساب.\n\nمعلومات المتجر:\n${kb}`,
          },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("عدد الطلبات كبير، حاول بعد قليل");
    if (res.status === 402) throw new Error("الخدمة غير متاحة مؤقتاً");
    if (!res.ok) throw new Error("تعذر الحصول على رد");

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { reply: json.choices?.[0]?.message?.content?.trim() || "عذراً، لم أفهم سؤالك." };
  });
