import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check admin role
    const { data: isAdmin } = await supabaseClient.rpc("has_cargo", { _user_id: user.id, _cargo: "admin" });
    if (!isAdmin) throw new Error("Only admins can manage plans");

    const { nome, valor_mensal, existingProductId } = await req.json();
    if (!nome || !valor_mensal) throw new Error("nome and valor_mensal are required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let productId = existingProductId;

    // Create or update product
    if (productId) {
      await stripe.products.update(productId, { name: nome });
    } else {
      const product = await stripe.products.create({
        name: nome,
        description: `Plano ${nome} - MedFollow`,
      });
      productId = product.id;
    }

    // Create new price (Stripe prices are immutable, so always create new)
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(valor_mensal * 100),
      currency: "brl",
      recurring: { interval: "month" },
    });

    return new Response(JSON.stringify({
      product_id: productId,
      price_id: price.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
