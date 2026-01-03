# Push Notifications Implementation Plan

**Project:** Talking Music League  
**Sprint Goal:** Implement native push notifications via Firebase Cloud Messaging  
**Estimated Duration:** 2-3 weeks (15-20 days)  
**Linear Issues:** [LOYD-129](https://linear.app/loydmilligan/issue/LOYD-129) (Android), [LOYD-130](https://linear.app/loydmilligan/issue/LOYD-130) (iOS)  
**Created:** 2026-01-03  
**Updated:** 2026-01-03 (migrated to FCM v1 API)  
**Status:** Planning

---

## Executive Summary

Add native push notifications to TML app to improve user engagement and real-time awareness of:
- New round announcements
- Submission/voting deadlines approaching
- Round results revealed
- New comments/reactions on user's submissions
- Chat messages in active rounds

**Current State:** Using ntfy server for basic notifications (edge function: `notify`)  
**Target State:** Native iOS (APNs) and Android (FCM) push notifications with user preferences  
**Approach:** Firebase Cloud Messaging v1 API with service account authentication (modern, secure)

---

## Why Firebase Cloud Messaging v1 API?

**Pros:**
- ✅ Single SDK for both iOS and Android
- ✅ Free tier supports millions of messages (10M/month)
- ✅ Battle-tested reliability
- ✅ Built-in analytics
- ✅ OAuth2 authentication (more secure than legacy server key)
- ✅ No Apple Developer account required for web-based notifications
- ✅ Automatic APNs conversion for iOS Safari
- ✅ Future-proof (legacy API being deprecated)

**Cons:**
- ⚠️ Vendor lock-in to Google
- ⚠️ Adds Firebase dependency (~50KB gzipped)
- ⚠️ Requires service worker (potential conflicts)
- ⚠️ No batch sending in v1 API (must send individually)

**Why v1 API over Legacy:**
- Legacy server key is deprecated (Google ending support)
- OAuth2 tokens expire (1-hour TTL = better security)
- Better error handling and debugging
- Platform-specific customization

---

## Technical Architecture

```
User Device (iOS/Android/Desktop)
    ↓ 
    [User grants notification permission]
    ↓
    [FCM generates device token]
    ↓
Supabase (push_tokens table)
    ↓
Edge Function: send-push-notification
    ↓
    [Generates OAuth2 token from service account]
    ↓
Firebase Cloud Messaging v1 API
    ↓
    [Routes to appropriate platform]
    ↓
APNs (iOS) / FCM (Android) / Web Push (Desktop)
    ↓
User Device (receives notification)
```

---

## Implementation Phases

### Phase 1: Foundation (3-4 days)

#### 1.1 Firebase Project Setup
**Tasks:**
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Cloud Messaging API
- [ ] Add web app to Firebase project
- [ ] Generate VAPID key for web push
- [ ] **Generate service account JSON** (Project Settings → Service Accounts → Generate New Private Key)

**Environment Variables:**
```bash
# Client-side (.env)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...

# Server-side (Supabase Edge Function secrets)
# Extract from downloaded service account JSON file
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Setting Supabase Secrets:**
```bash
# Option 1: Manual (preserving newlines)
supabase secrets set FIREBASE_PROJECT_ID="your-project-id"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----'

# Option 2: Extract from JSON using jq
supabase secrets set FIREBASE_PROJECT_ID="$(cat service-account.json | jq -r .project_id)"
supabase secrets set FIREBASE_CLIENT_EMAIL="$(cat service-account.json | jq -r .client_email)"
supabase secrets set FIREBASE_PRIVATE_KEY="$(cat service-account.json | jq -r .private_key)"
```

**⚠️ CRITICAL SECURITY:**
- Never commit service account JSON to git
- Store securely (1Password, environment variables only)
- Only edge function should access these credentials

#### 1.2 Install Dependencies
```bash
cd web
npm install firebase
```

**Package.json addition:**
```json
{
  "dependencies": {
    "firebase": "^10.7.1"
  }
}
```

#### 1.3 Service Worker Setup
**File:** `web/public/firebase-messaging-sw.js`

```javascript
// ⚠️ CRITICAL: Must be at root of public directory, cannot be bundled
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Talking Music League';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    data: payload.data || {},
    tag: payload.data?.type || 'default',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.click_action || '/app';
  event.waitUntil(clients.openWindow(clickAction));
});
```

#### 1.4 Initialize Firebase in App
**File:** `web/src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const messaging = getMessaging(firebaseApp);

export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    callback(payload);
  });
};
```

---

### Phase 2: Token Registration (2-3 days)

#### 2.1 Database Schema
```sql
-- Push notification tokens
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null unique,
  platform text check (platform in ('web', 'ios', 'android')),
  device_info jsonb,
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  unique (user_id, token)
);

create index push_tokens_user_id_idx on push_tokens(user_id);
create index push_tokens_token_idx on push_tokens(token);
create index push_tokens_last_used_idx on push_tokens(last_used_at);

-- RLS policies
alter table push_tokens enable row level security;

create policy "Users can view own tokens" on push_tokens
  for select using (user_id = auth.uid());

create policy "Users can insert own tokens" on push_tokens
  for insert with check (user_id = auth.uid());

create policy "Users can update own tokens" on push_tokens
  for update using (user_id = auth.uid());

create policy "Users can delete own tokens" on push_tokens
  for delete using (user_id = auth.uid());
```

#### 2.2 Token Registration Hook
**File:** `web/src/hooks/usePushNotifications.ts`

```typescript
import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (!token) {
        setError('Failed to get FCM token');
        setIsLoading(false);
        return false;
      }

      const platform = detectPlatform();

      const { error: dbError } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user?.id,
          token,
          platform,
          device_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${window.screen.width}x${window.screen.height}`,
          },
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (dbError) {
        setError('Failed to save token');
        console.error(dbError);
        setIsLoading(false);
        return false;
      }

      setIsEnabled(true);
      setIsLoading(false);
      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };

  const detectPlatform = (): 'web' | 'ios' | 'android' => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'web';
  };

  useEffect(() => {
    if ('Notification' in window) {
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  return {
    isEnabled,
    isLoading,
    error,
    requestPermission,
  };
};
```

#### 2.3 Settings UI
**File:** `web/src/components/settings/PushNotificationToggle.tsx`

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PushNotificationToggle = () => {
  const { isEnabled, isLoading, error, requestPermission } = usePushNotifications();

  if (!('Notification' in window)) {
    return (
      <Alert>
        <AlertDescription>
          Push notifications are not supported in this browser.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Push Notifications</h3>
          <p className="text-sm text-gray-600">
            Get notified about new rounds, deadlines, and comments
          </p>
        </div>
        
        {isEnabled ? (
          <span className="text-sm text-green-600">✓ Enabled</span>
        ) : (
          <Button onClick={requestPermission} disabled={isLoading}>
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
```

---

### Phase 3: Notification Sending with FCM v1 API (3-4 days)

#### 3.1 Edge Function (UPDATED FOR v1 API)
**File:** `supabase/functions/send-push-notification/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");
const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY");
const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type NotificationRequest = {
  user_ids?: string[];
  group_id?: string;
  round_id?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  click_action?: string;
  notification_type?: string;
};

// Generate OAuth2 access token for FCM v1 API
async function getAccessToken(): Promise<string> {
  const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];
  
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedToken);
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
  const encodedSignature = arrayBufferToBase64(signature);
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const { access_token } = await response.json();
  return access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
  clickAction: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    
    const message = {
      message: {
        token,
        notification: { title, body },
        data,
        webpush: {
          fcm_options: { link: clickAction },
          notification: {
            icon: "/logo-192.png",
            badge: "/badge-72.png",
          },
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FCM error:", errorText);
      
      if (errorText.includes("NOT_FOUND") || errorText.includes("INVALID_ARGUMENT")) {
        return { success: false, error: "INVALID_TOKEN" };
      }
      
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error("FCM send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const {
      user_ids,
      group_id,
      round_id,
      title,
      body,
      data,
      click_action,
      notification_type,
    }: NotificationRequest = await req.json();

    let targetUserIds: string[] = user_ids || [];

    if (group_id) {
      const { data: members } = await supabase
        .from("group_members")
        .select("member_id")
        .eq("group_id", group_id);
      
      targetUserIds = members?.map((m) => m.member_id) || [];
    }

    if (round_id) {
      const { data: submitters } = await supabase
        .from("submissions")
        .select("submitter_id")
        .eq("round_id", round_id);
      
      targetUserIds = [
        ...targetUserIds,
        ...(submitters?.map((s) => s.submitter_id) || []),
      ];
      
      targetUserIds = [...new Set(targetUserIds)];
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target users specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (notification_type) {
      const { data: allowedUsers } = await supabase
        .from("notification_preferences")
        .select("user_id")
        .in("user_id", targetUserIds)
        .eq(notification_type, true);

      targetUserIds = allowedUsers?.map((u) => u.user_id) || [];
    }

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token, user_id")
      .in("user_id", targetUserIds);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No tokens to send to" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to each token (FCM v1 doesn't support batch)
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (const { token, user_id } of tokens) {
      const result = await sendFCMNotification(
        token,
        title,
        body,
        data || {},
        click_action || "/app"
      );

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (result.error === "INVALID_TOKEN") {
          invalidTokens.push(token);
        }
      }
    }

    if (invalidTokens.length > 0) {
      await supabase
        .from("push_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        invalid_tokens_removed: invalidTokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

#### 3.2 Notification Triggers

**New Round:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    group_id: groupId,
    title: '🎵 New Round Started!',
    body: `Theme: "${roundTheme}" - Submit by ${formatDeadline(deadline)}`,
    data: { type: 'new_round', round_id: roundId },
    click_action: `/app/rounds/${roundId}`,
    notification_type: 'new_rounds',
  },
});
```

**Deadline Reminder:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    user_ids: pendingUsers,
    title: '⏰ Deadline Tomorrow',
    body: `Don't forget to submit for "${round.theme}"`,
    data: { type: 'deadline_reminder', round_id: round.id },
    click_action: `/app/rounds/${round.id}`,
    notification_type: 'deadline_reminders',
  },
});
```

**Results Revealed:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    group_id: groupId,
    title: '🏆 Results Are In!',
    body: `See who won "${roundTheme}"`,
    data: { type: 'results_revealed', round_id: roundId },
    click_action: `/app/history/${roundId}`,
    notification_type: 'results_revealed',
  },
});
```

---

### Phase 4: User Preferences (2 days)

```sql
create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  new_rounds boolean default true,
  deadline_reminders boolean default true,
  results_revealed boolean default true,
  comments_on_submissions boolean default true,
  chat_messages boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table notification_preferences enable row level security;

create policy "Users can view own preferences" on notification_preferences
  for select using (user_id = auth.uid());

create policy "Users can insert own preferences" on notification_preferences
  for insert with check (user_id = auth.uid());

create policy "Users can update own preferences" on notification_preferences
  for update using (user_id = auth.uid());
```

---

### Phase 5: Testing (3-4 days)

**Cross-Platform Checklist:**
- [ ] Android Chrome
- [ ] Android Firefox
- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Desktop Chrome
- [ ] Desktop Firefox

**Functionality:**
- [ ] Permission flow
- [ ] Token registration
- [ ] Foreground notifications
- [ ] Background notifications
- [ ] Preferences respected
- [ ] Invalid token cleanup

---

## FCM v1 vs Legacy API Comparison

| Feature | Legacy API | FCM v1 API |
|---------|-----------|------------|
| **Auth** | Static server key | OAuth2 access token (1-hour TTL) |
| **Endpoint** | `/fcm/send` | `/v1/projects/{id}/messages:send` |
| **Batch** | ✅ Yes | ❌ No (send individually) |
| **Security** | Static key (can leak) | Time-limited tokens |
| **Error Codes** | Basic | Detailed |
| **Platform Options** | Limited | Web/iOS/Android specific |
| **Future** | Deprecated | Supported |

---

## Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Foundation | 3-4 days | Firebase setup, service worker, client SDK |
| Token Registration | 2-3 days | Database, hooks, settings UI |
| Notification Sending | 3-4 days | Edge function (v1 API), 5 triggers |
| User Preferences | 2 days | Preferences schema, UI |
| Testing & QA | 3-4 days | Cross-platform testing |
| **Total** | **15-20 days** | |

---

## Success Metrics

**Technical:**
- Token registration > 95%
- Message delivery > 90%
- Latency < 5 seconds
- Zero service worker conflicts

**User:**
- 70%+ enable notifications
- 50%+ click-through rate
- < 10% unsubscribe in first month

---

## Definition of Done

- [ ] Firebase project created with service account
- [ ] Database schema deployed with RLS
- [ ] Service worker tested (no conflicts)
- [ ] Token registration working (all platforms)
- [ ] Edge function deployed with v1 API
- [ ] All 5 notification triggers implemented
- [ ] User preferences UI complete
- [ ] Cross-platform testing complete
- [ ] Zero critical bugs
- [ ] Documentation updated
- [ ] 70%+ user adoption

---

**Status:** Ready for implementation  
**Next Action:** Generate service account JSON from Firebase Console
