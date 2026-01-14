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

  // Format message for HTML - convert newlines and handle quote formatting
  const formatMessageHtml = (msg: string) => {
    const escaped = escapeHtml(msg);
    // Check if message has quote format (↳ "quoted text")
    const quoteMatch = escaped.match(/^(.+?) replied to (.+?):\n↳ &quot;(.+?)&quot;\n\n(.+)$/s);
    if (quoteMatch) {
      const [, author, quotedAuthor, quotedText, actualMessage] = quoteMatch;
      return `<p style="color:#6366f1;margin:0 0 8px 0;font-size:14px;">${author} replied to ${quotedAuthor}:</p>` +
        `<div style="border-left:3px solid #6366f1;padding-left:12px;margin:0 0 16px 0;color:#64748b;font-style:italic;">${quotedText}</div>` +
        `<p style="color:#334155;line-height:1.6;margin:0;font-size:16px;">${actualMessage.replace(/\n/g, '<br>')}</p>`;
    }
    // Regular message - just convert newlines
    return `<p style="color:#334155;line-height:1.6;margin:0;font-size:16px;">${escaped.replace(/\n/g, '<br>')}</p>`;
  };

  // Build HTML without indentation to avoid quoted-printable encoding issues
  const buttonHtml = link
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td style="background-color:#4f46e5;border-radius:8px;"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(linkText)}</a></td></tr></table>`
    : '';

  const htmlMessage = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
    '<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:20px;background-color:#f8fafc;">' +
    '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">' +
    '<tr><td style="background-color:#ffffff;border-radius:12px;padding:24px;">' +
    `<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:18px;font-weight:600;">${escapeHtml(title)}</h2>` +
    formatMessageHtml(message) +
    buttonHtml +
    '</td></tr>' +
    '<tr><td style="padding-top:20px;text-align:center;">' +
    '<p style="color:#64748b;font-size:12px;margin:0;">Talking Music League</p>' +
    '</td></tr></table></body></html>';

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
