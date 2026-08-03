import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };

const ChatCtx = createContext<Ctx | null>(null);

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <ChatCtx.Provider value={{ open, setOpen }}>{children}</ChatCtx.Provider>;
}

/** Safe outside the provider (e.g. admin routes) — returns a no-op controller. */
export function useChatUI(): Ctx {
  return useContext(ChatCtx) ?? { open: false, setOpen: () => {} };
}
