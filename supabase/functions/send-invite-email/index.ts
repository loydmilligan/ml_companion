import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://talking.mattmariani.com";

const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL");
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");

type RequestBody = {
  invite_id: string;
  email: string;
  group_name: string;
  inviter_name?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return unauthorizedResponse(authError, corsHeaders);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: RequestBody = await req.json();
    const { invite_id, email, group_name, inviter_name } = body;

    if (!invite_id || !email) {
      return new Response(
        JSON.stringify({ error: "Missing invite_id or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the invite code
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("code")
      .eq("id", invite_id)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Invite not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviteLink = `${APP_BASE_URL}/invite?code=${invite.code}`;

    // If no SMTP credentials, just update the invite with the email and skip sending
    if (!SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_FROM_EMAIL) {
      await supabase
        .from("invites")
        .update({ invite_email: email })
        .eq("id", invite_id);

      return new Response(
        JSON.stringify({
          success: true,
          email_sent: false,
          message: "Email saved but not sent (SMTP not configured)",
          invite_link: inviteLink,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content
    const subject = `You're invited to join ${group_name} on The Music League!`;
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; margin-bottom: 16px;">You're Invited!</h1>

        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          ${inviter_name ? `<strong>${inviter_name}</strong> has invited you` : "You've been invited"} to join
          <strong>${group_name}</strong> on The Music League Companion app.
        </p>

        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Join your family and friends in sharing and discovering music together!
        </p>

        <div style="margin: 32px 0;">
          <a href="${inviteLink}"
             style="background-color: #805ad5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>

        <p style="color: #718096; font-size: 14px;">
          Or copy this link: <a href="${inviteLink}" style="color: #805ad5;">${inviteLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

        <p style="color: #a0aec0; font-size: 12px;">
          This invitation was sent from The Music League Companion app.
        </p>
      </div>
    `;

    // Send email via SMTP (Gmail)
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_PORT === 465,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        },
      },
    });

    try {
      await client.send({
        from: SMTP_FROM_EMAIL,
        to: [email],
        subject: subject,
        content: htmlContent,
        html: htmlContent,
      });

      // Update invite with email and sent timestamp
      await supabase
        .from("invites")
        .update({
          invite_email: email,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", invite_id);

      return new Response(
        JSON.stringify({
          success: true,
          email_sent: true,
          invite_link: inviteLink,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("SMTP error:", emailError);

      // Still save the email to the invite
      await supabase
        .from("invites")
        .update({ invite_email: email })
        .eq("id", invite_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to send email: ${String(emailError)}`,
          email_saved: true,
          invite_link: inviteLink,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      await client.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
