import { corsHeaders } from "../_shared/cors.ts";
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

  const body = await req.json().catch(() => ({}));
  const title = body?.title ?? "Talking Music League";
  const message = body?.message ?? "";
  const recipients = body?.recipients ?? [];

  if (!message) {
    return new Response(
      JSON.stringify({ error: "Missing message" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: Record<string, string> = {};

  if (NTFY_SERVER_URL && NTFY_TOPIC) {
    const headers: Record<string, string> = { Title: title };
    if (NTFY_AUTH_TOKEN) headers.Authorization = `Bearer ${NTFY_AUTH_TOKEN}`;
    if (NTFY_USERNAME && NTFY_PASSWORD) {
      const token = btoa(`${NTFY_USERNAME}:${NTFY_PASSWORD}`);
      headers.Authorization = `Basic ${token}`;
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
        contentType: "text/plain; charset=utf-8",
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
