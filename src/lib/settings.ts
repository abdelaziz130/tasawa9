import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  id: string;
  store_name: string;
  whatsapp_number: string;
  default_theme: string;
  chatbot_kb: string;
};

export const DEFAULT_WHATSAPP = "213782524124";

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("id,store_name,whatsapp_number,default_theme,chatbot_kb")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as StoreSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWhatsAppNumber() {
  const { data } = useStoreSettings();
  return data?.whatsapp_number || DEFAULT_WHATSAPP;
}
