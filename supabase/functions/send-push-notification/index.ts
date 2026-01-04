import { corsHeaders } from "../_shared/cors.ts";
import { verifyAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// FCM v1 API Configuration
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY");

// Notification types
type NotificationType =
  | "new_round"
  | "deadline_reminder"
  | "results_revealed"
  | "comment"
  | "chat_message";

interface PushRequest {
  notification_type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  // Targeting options (at least one required)
  user_ids?: string[];
  group_id?: string;
  round_id?: string;
}

interface FCMMessage {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    webpush?: {
      fcm_options?: {
        link?: string;
      };
      notification?: {
        icon?: string;
        badge?: string;
      };
    };
  };
}

// OAuth2 token cache
let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Convert PEM private key to ArrayBuffer for Web Crypto API
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Handle both escaped newlines and actual newlines
  const pemContents = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Create a JWT for Google OAuth2 authentication
 */
async function createJWT(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${signatureB64}`;
}

/**
 * Get OAuth2 access token for FCM v1 API
 */
async function getAccessToken(): Promise<string> {
  // Check cache
  if (cachedToken && cachedToken.expiry > Date.now() + 60000) {
    return cachedToken.token;
  }

  if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase credentials not configured");
  }

  const jwt = await createJWT(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth2 token request failed: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Send a single push notification via FCM v1 API
 */
async function sendFCMNotification(
  accessToken: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string; shouldRemoveToken?: boolean }> {
  const message: FCMMessage = {
    message: {
      token,
      notification: { title, body },
      webpush: {
        notification: {
          icon: "/favicon.png",
          badge: "/favicon.png",
        },
      },
    },
  };

  if (data) {
    message.message.data = data;
    if (data.url) {
      message.message.webpush!.fcm_options = { link: data.url };
    }
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (response.ok) {
    return { success: true };
  }

  const error = await response.json().catch(() => ({}));
  const errorCode = error?.error?.details?.[0]?.errorCode || error?.error?.code;

  // Token is invalid or expired - should be removed
  if (
    errorCode === "UNREGISTERED" ||
    errorCode === "INVALID_ARGUMENT" ||
    response.status === 404
  ) {
    return {
      success: false,
      error: `Token invalid: ${errorCode}`,
      shouldRemoveToken: true,
    };
  }

  return { success: false, error: `FCM error: ${JSON.stringify(error)}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify JWT authentication
  const { user, error: authError } = await verifyAuth(req);
  if (authError) {
    return unauthorizedResponse(authError, corsHeaders);
  }

  // Check Firebase configuration
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return new Response(
      JSON.stringify({ error: "Firebase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let body: PushRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { notification_type, title, body: messageBody, data, user_ids, group_id } = body;

  if (!notification_type || !title || !messageBody) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: notification_type, title, body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!user_ids?.length && !group_id) {
    return new Response(
      JSON.stringify({ error: "Must specify user_ids or group_id" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create Supabase client with service role
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get target user IDs
  let targetUserIds: string[] = user_ids || [];

  if (group_id && !user_ids?.length) {
    // Get all members of the group
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("member_id")
      .eq("group_id", group_id);

    if (membersError) {
      return new Response(
        JSON.stringify({ error: `Failed to get group members: ${membersError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    targetUserIds = members.map((m) => m.member_id);
  }

  if (!targetUserIds.length) {
    return new Response(
      JSON.stringify({ status: "ok", sent: 0, message: "No target users" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Map notification type to preference column
  const preferenceColumn: Record<NotificationType, string> = {
    new_round: "new_rounds",
    deadline_reminder: "deadline_reminders",
    results_revealed: "results_revealed",
    comment: "comments_on_submissions",
    chat_message: "chat_messages",
  };

  // Get notification preferences for target users
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("user_id, " + preferenceColumn[notification_type])
    .in("user_id", targetUserIds);

  // Filter out users who have disabled this notification type
  const prefsMap = new Map(
    (preferences || []).map((p) => [p.user_id, p[preferenceColumn[notification_type]]])
  );

  // Users without preferences get defaults (all enabled)
  const enabledUserIds = targetUserIds.filter((userId) => {
    const pref = prefsMap.get(userId);
    return pref === undefined ? true : pref;
  });

  if (!enabledUserIds.length) {
    return new Response(
      JSON.stringify({ status: "ok", sent: 0, message: "All users have disabled this notification type" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get push tokens for enabled users
  const { data: tokens, error: tokensError } = await supabase
    .from("push_tokens")
    .select("id, user_id, token")
    .in("user_id", enabledUserIds);

  if (tokensError) {
    return new Response(
      JSON.stringify({ error: `Failed to get push tokens: ${tokensError.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!tokens?.length) {
    return new Response(
      JSON.stringify({ status: "ok", sent: 0, message: "No push tokens registered" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get OAuth2 access token
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Failed to get access token: ${error}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Send notifications to all tokens
  const results = await Promise.all(
    tokens.map(async (t) => {
      const result = await sendFCMNotification(
        accessToken,
        t.token,
        title,
        messageBody,
        data
      );

      // Remove invalid tokens
      if (result.shouldRemoveToken) {
        await supabase.from("push_tokens").delete().eq("id", t.id);
      }

      return { tokenId: t.id, userId: t.user_id, ...result };
    })
  );

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const removed = results.filter((r) => r.shouldRemoveToken).length;

  return new Response(
    JSON.stringify({
      status: "ok",
      sent,
      failed,
      removed,
      details: results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
