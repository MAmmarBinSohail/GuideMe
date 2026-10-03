import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, value } = await req.json();

    let error = null;

    if (action === "block") {
      console.log("Blocking user:", userId, "value:", value);
      const result = await supabase
        .from("profiles")
        .update({ is_blocked: value })
        .eq("id", userId);
      console.log("Block result:", JSON.stringify(result));
      error = result.error;
    }

    if (action === "verify") {
      ({ error } = await supabase
        .from("profiles")
        .update({ is_verified: value })
        .eq("id", userId));
    }

    if (action === "change_role") {
      // Cancel all bookings if becoming admin
      if (value === "admin") {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("mentee_id", userId)
          .eq("status", "confirmed");

        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("mentor_id", userId)
          .eq("status", "confirmed");
      }

      ({ error } = await supabase
        .from("profiles")
        .update({ role: value })
        .eq("id", userId));
    }

    if (action === "delete_video") {
      ({ error } = await supabase
        .from("mentor_videos")
        .delete()
        .eq("id", userId)); // userId here is videoId
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});