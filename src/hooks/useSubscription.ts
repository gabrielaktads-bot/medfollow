import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanos, type Plano } from "@/hooks/usePlanos";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { session } = useAuth();
  const { planos } = usePlanos();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        productId: data.product_id ?? null,
        priceId: data.price_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [session]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const createPublicCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-public-checkout", {
      body: { priceId, origin: window.location.origin },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  // Match current subscription to a plano from DB
  const currentPlano: Plano | null = planos.find(
    (p) => p.stripe_price_id === state.priceId || p.stripe_product_id === state.productId
  ) ?? null;

  return { ...state, currentPlano, planos, createCheckout, createPublicCheckout, openPortal, refresh: checkSubscription };
};
