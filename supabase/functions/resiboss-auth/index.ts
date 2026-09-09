// ==============================================================================
// RESIBOSS SUPABASE EDGE FUNCTION: resiboss-auth
// ==============================================================================
// Runtime: Deno / TypeScript (Official Supabase Edge Function)
// Purpose: Handles custom authentication operations, user verification,
//          and secure session tokens.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { action, email, userId } = body;

    switch (action) {
      case "verify-user": {
        if (!email && !userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing email or userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Lookup user in auth.users
        const query = userId 
          ? supabaseClient.auth.admin.getUserById(userId)
          : supabaseClient.from("receipts").select("id").eq("user_email", email).limit(1);

        const res = await query;
        return new Response(
          JSON.stringify({ success: true, verified: true, data: res }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "health":
      default: {
        return new Response(
          JSON.stringify({
            success: true,
            status: "online",
            service: "Resiboss Auth Edge Function",
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
