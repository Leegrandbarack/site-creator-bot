import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same hash function as send-otp
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface VerifyOTPRequest {
  phoneNumber: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code }: VerifyOTPRequest = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ error: "Numéro de téléphone et code requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Le code doit contenir 6 chiffres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the most recent non-verified code for this phone number
    const { data: verificationCode, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      console.log("No valid code found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Code expiré ou invalide. Veuillez demander un nouveau code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if max attempts exceeded
    if (verificationCode.attempts >= verificationCode.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Nombre maximum de tentatives atteint. Veuillez demander un nouveau code." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Hash the provided code and compare
    const providedHash = await hashCode(code);

    if (providedHash !== verificationCode.code_hash) {
      // Increment attempts
      await supabase
        .from("verification_codes")
        .update({ attempts: verificationCode.attempts + 1 })
        .eq("id", verificationCode.id);

      const remainingAttempts = verificationCode.max_attempts - verificationCode.attempts - 1;
      return new Response(
        JSON.stringify({ 
          error: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
          remainingAttempts
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as verified
    await supabase
      .from("verification_codes")
      .update({ verified: true })
      .eq("id", verificationCode.id);

    console.log(`✅ Code vérifié avec succès pour ${phoneNumber}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Numéro de téléphone vérifié avec succès",
        verified: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
