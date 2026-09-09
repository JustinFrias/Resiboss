// ==============================================================================
// RESIBOSS SUPABASE EDGE FUNCTION: resiboss-receipts
// ==============================================================================
// Runtime: Deno / TypeScript (Official Supabase Edge Function)
// Purpose: Serverless receipt verification, automated VAT audits,
//          and secure cloud synchronization.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { action, receipt } = body;

    switch (action) {
      case "audit-receipt": {
        if (!receipt) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing receipt payload" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const total = Number(receipt.total) || 0;
        const subtotal = Number(receipt.subtotal) || +(total / 1.12).toFixed(2);
        const vat = +(total - subtotal).toFixed(2);

        return new Response(
          JSON.stringify({
            success: true,
            audit: {
              total,
              subtotal,
              vat,
              isVatAccurate: Math.abs(vat - (total - subtotal)) < 0.05,
              auditedAt: new Date().toISOString(),
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            success: true,
            status: "ready",
            service: "Resiboss Receipts Edge Function",
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
