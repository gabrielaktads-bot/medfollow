import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[HANDLE-CHECKOUT-SUCCESS] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    logStep("Received session_id", { session_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve session with line_items expanded to get the price_id
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });
    logStep("Session retrieved", { status: session.status, email: session.customer_email || session.customer_details?.email });

    if (session.status !== "complete") {
      throw new Error("Checkout session is not complete");
    }

    const email = session.customer_email || session.customer_details?.email;
    if (!email) throw new Error("No email found in checkout session");

    // Extract price_id from line items
    const priceId = session.line_items?.data?.[0]?.price?.id ?? null;
    logStep("Extracted price_id", { priceId });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;
    let isNewUser = false;
    let tempPassword: string | null = null;

    if (existingUser) {
      userId = existingUser.id;
      logStep("Existing user found", { userId });
    } else {
      // Create new user with a temporary password
      tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      isNewUser = true;
      logStep("New user created", { userId });
    }

    return new Response(
      JSON.stringify({
        email,
        user_id: userId,
        is_new_user: isNewUser,
        temp_password: tempPassword,
        price_id: priceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
