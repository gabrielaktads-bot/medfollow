import { supabase } from "@/integrations/supabase/client";

export async function createPublicCheckout(priceId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("create-public-checkout", {
    body: { priceId, origin: window.location.origin },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
}
