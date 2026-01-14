import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

const NTFY_SERVER_URL = Deno.env.get("NTFY_SERVER_URL");
const NTFY_TOPIC = Deno.env.get("NTFY_TOPIC");
const NTFY_USERNAME = Deno.env.get("NTFY_USERNAME");
const NTFY_PASSWORD = Deno.env.get("NTFY_PASSWORD");
const NTFY_AUTH_TOKEN = Deno.env.get("NTFY_AUTH_TOKEN");

const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL");
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return unauthorizedResponse(authError, corsHeaders);
  }

  const body = await req.json().catch(() => ({}));
  const title = body?.title ?? "Talking Music League";
  const message = body?.message ?? "";
  const recipients = body?.recipients ?? [];
  const link = body?.link ?? null;
  const linkText = body?.linkText ?? "Open in App";

  if (!message) {
    return new Response(
      JSON.stringify({ error: "Missing message" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build HTML email content
  const escapeHtml = (str: string) => str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m] ?? m));

  const htmlMessage = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">${escapeHtml(title)}</h2>
    <p style="color: #334155; line-height: 1.6; margin: 0 0 20px 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
    ${link ? `
    <a href="${escapeHtml(link)}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">${escapeHtml(linkText)}</a>
    ` : ''}
  </div>
  <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
    Talking Music League
  </p>
</body>
</html>
  `.trim();

  const results: Record<string, string> = {};

  if (NTFY_SERVER_URL && NTFY_TOPIC) {
    const headers: Record<string, string> = { Title: title };
    if (NTFY_AUTH_TOKEN) headers.Authorization = `Bearer ${NTFY_AUTH_TOKEN}`;
    if (NTFY_USERNAME && NTFY_PASSWORD) {
      const token = btoa(`${NTFY_USERNAME}:${NTFY_PASSWORD}`);
      headers.Authorization = `Basic ${token}`;
    }
    // Add click action if link is provided
    if (link) {
      headers.Click = link;
    }

    const url = `${NTFY_SERVER_URL.replace(/\/$/, "")}/${NTFY_TOPIC}`;
    const ntfyResp = await fetch(url, {
      method: "POST",
      headers,
      body: message,
    });

    results.ntfy = ntfyResp.ok ? "sent" : `failed:${ntfyResp.status}`;
  } else {
    results.ntfy = "skipped";
  }

  if (SMTP_USERNAME && SMTP_PASSWORD && SMTP_FROM_EMAIL && recipients.length) {
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
        to: recipients,
        subject: title,
        content: message,
        html: htmlMessage,
      });
      results.email = "sent";
    } catch (error) {
      results.email = `failed:${String(error)}`;
    } finally {
      await client.close();
    }
  } else {
    results.email = "skipped";
  }

  return new Response(
    JSON.stringify({ status: "ok", results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
