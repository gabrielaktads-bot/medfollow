import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, check_only } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to find existing user by email
    const { data: users, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) throw listError;

    const existingUser = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    // If check_only, just return whether user exists
    if (check_only) {
      return new Response(
        JSON.stringify({ exists: !!existingUser, user_id: existingUser?.id || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ user_id: existingUser.id, created: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new user - use provided password or create without password
    const createPayload: Record<string, unknown> = {
      email,
      email_confirm: true,
    };
    if (password && typeof password === "string" && password.length >= 6) {
      createPayload.password = password;
    }

    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser(createPayload);

    if (createError) throw createError;

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, created: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
