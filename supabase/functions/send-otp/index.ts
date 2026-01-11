import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for OTP (in production, use bcrypt via edge function)
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a random 6-digit code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface SendOTPRequest {
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber }: SendOTPRequest = await req.json();

    if (!phoneNumber || phoneNumber.length < 8) {
      return new Response(
        JSON.stringify({ error: "Numéro de téléphone invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for rate limiting - max 3 codes per phone in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentCodes, error: countError } = await supabase
      .from("verification_codes")
      .select("id")
      .eq("phone_number", phoneNumber)
      .gte("created_at", tenMinutesAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if (recentCodes && recentCodes.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Veuillez réessayer dans 10 minutes." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP code
    const otpCode = generateOTP();
    const codeHash = await hashCode(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Store the hashed code
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        phone_number: phoneNumber,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 🔥 CONSOLE MODE: Log the code for development
    console.log("===========================================");
    console.log(`📱 CODE OTP pour ${phoneNumber}: ${otpCode}`);
    console.log(`⏰ Expire à: ${new Date(expiresAt).toLocaleString()}`);
    console.log("===========================================");

    // In production, you would send SMS here via Twilio:
    // const twilio = new Twilio(accountSid, authToken);
    // await twilio.messages.create({
    //   body: `Votre code de vérification est: ${otpCode}`,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Code envoyé avec succès",
        // DEV MODE: Return the code for testing (remove in production!)
        devCode: otpCode 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
