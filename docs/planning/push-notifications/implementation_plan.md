# Push Notifications Implementation Plan

**Project:** Talking Music League  
**Sprint Goal:** Implement native push notifications via Firebase Cloud Messaging  
**Estimated Duration:** 2-3 weeks (15-20 days)  
**Linear Issues:** [LOYD-129](https://linear.app/loydmilligan/issue/LOYD-129) (Android), [LOYD-130](https://linear.app/loydmilligan/issue/LOYD-130) (iOS)  
**Created:** 2026-01-03  
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
**Approach:** Firebase Cloud Messaging (unified solution for both platforms)

---

## Why Firebase Cloud Messaging?

**Pros:**
- ✅ Single SDK for both iOS and Android
- ✅ Free tier supports millions of messages (10M/month)
- ✅ Battle-tested reliability
- ✅ Built-in analytics
- ✅ Topic-based messaging (useful for group/round notifications)
- ✅ No Apple Developer account required for web-based notifications
- ✅ Automatic APNs conversion for iOS Safari

**Cons:**
- ⚠️ Vendor lock-in to Google
- ⚠️ Adds Firebase dependency (~50KB gzipped)
- ⚠️ Requires service worker (potential conflicts)

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
Firebase Cloud Messaging API
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
- [ ] Get Firebase config credentials

**Environment Variables:**
```bash
# Add to .env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...

# Add to Supabase Edge Function secrets
FIREBASE_SERVER_KEY=...
```

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

**⚠️ CRITICAL:** Service worker must be at root of public directory, cannot be bundled.

```javascript
// web/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const clickAction = event.notification.data?.click_action || '/app';
  
  event.waitUntil(
    clients.openWindow(clickAction)
  );
});
```

**Risk Mitigation:** Test with existing PWA/caching to ensure no conflicts.

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

// Listen for foreground messages (when app is in focus)
export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};
```

---

### Phase 2: Token Registration (2-3 days)

#### 2.1 Database Schema
**File:** `supabase/schema.sql`

```sql
-- Push notification tokens
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null unique,
  platform text check (platform in ('web', 'ios', 'android')),
  device_info jsonb, -- {device_name, os_version, browser, user_agent}
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  unique (user_id, token)
);

create index push_tokens_user_id_idx on push_tokens(user_id);
create index push_tokens_token_idx on push_tokens(token);
create index push_tokens_last_used_idx on push_tokens(last_used_at);
```

#### 2.2 RLS Policies
**File:** `supabase/rls.sql`

```sql
alter table push_tokens enable row level security;

drop policy if exists "Users can view own tokens" on push_tokens;
create policy "Users can view own tokens" on push_tokens
  for select using (user_id = auth.uid());

drop policy if exists "Users can insert own tokens" on push_tokens;
create policy "Users can insert own tokens" on push_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own tokens" on push_tokens;
create policy "Users can update own tokens" on push_tokens
  for update using (user_id = auth.uid());

drop policy if exists "Users can delete own tokens" on push_tokens;
create policy "Users can delete own tokens" on push_tokens
  for delete using (user_id = auth.uid());
```

#### 2.3 Token Registration Hook
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
      // 1. Request browser permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // 2. Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (!token) {
        setError('Failed to get FCM token');
        setIsLoading(false);
        return false;
      }

      // 3. Detect platform
      const platform = detectPlatform();

      // 4. Save to Supabase
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

  // Check current permission status on mount
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

#### 2.4 Settings UI Component
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
          <Button 
            onClick={requestPermission} 
            disabled={isLoading}
          >
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

### Phase 3: Notification Sending (3-4 days)

#### 3.1 Edge Function: send-push-notification
**File:** `supabase/functions/send-push-notification/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FIREBASE_SERVER_KEY = Deno.env.get("FIREBASE_SERVER_KEY");
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
  notification_type?: string; // For preference checking
};

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

    // 1. Determine target users
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

    // 2. Check user preferences
    if (notification_type) {
      const { data: allowedUsers } = await supabase
        .from("notification_preferences")
        .select("user_id")
        .in("user_id", targetUserIds)
        .eq(notification_type, true);

      targetUserIds = allowedUsers?.map((u) => u.user_id) || [];
    }

    // 3. Get FCM tokens
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

    // 4. Send to FCM
    const fcmPayload = {
      registration_ids: tokens.map((t) => t.token),
      notification: {
        title,
        body,
        click_action: click_action || "/app",
      },
      data: data || {},
    };

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${FIREBASE_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    if (!response.ok) {
      throw new Error(`FCM request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // 5. Handle invalid tokens
    if (result.results) {
      for (let i = 0; i < result.results.length; i++) {
        const error = result.results[i].error;
        if (error === "NotRegistered" || error === "InvalidRegistration") {
          await supabase
            .from("push_tokens")
            .delete()
            .eq("token", tokens[i].token);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: result.success || 0,
        failed: result.failure || 0,
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

**A. New Round Created**
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

**B. Deadline Reminder**
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

**C. Results Revealed**
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

**D. New Comment**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    user_ids: [submission.submitter_id],
    title: `💬 New comment from ${commenterName}`,
    body: `On "${submission.title}" by ${submission.artist}`,
    data: { type: 'new_comment', submission_id: submissionId },
    click_action: `/app/submissions/${submissionId}`,
    notification_type: 'comments_on_submissions',
  },
});
```

**E. Chat Message**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    round_id: roundId,
    title: `${authorName} in round chat`,
    body: messagePreview,
    data: { type: 'chat_message', round_id: roundId },
    click_action: `/app/rounds/${roundId}?tab=chat`,
    notification_type: 'chat_messages',
  },
});
```

---

### Phase 4: User Preferences (2 days)

#### 4.1 Schema
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

#### 4.2 Preferences UI
**File:** `web/src/components/settings/NotificationPreferences.tsx`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({
    new_rounds: true,
    deadline_reminders: true,
    results_revealed: true,
    comments_on_submissions: true,
    chat_messages: false,
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setPrefs(data);
  };

  const updatePref = async (key: string, value: boolean) => {
    setPrefs({ ...prefs, [key]: value });
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user?.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Notification Types</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>New Rounds</Label>
          <Switch
            checked={prefs.new_rounds}
            onCheckedChange={(v) => updatePref('new_rounds', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Deadline Reminders</Label>
          <Switch
            checked={prefs.deadline_reminders}
            onCheckedChange={(v) => updatePref('deadline_reminders', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Results Revealed</Label>
          <Switch
            checked={prefs.results_revealed}
            onCheckedChange={(v) => updatePref('results_revealed', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Comments on My Songs</Label>
          <Switch
            checked={prefs.comments_on_submissions}
            onCheckedChange={(v) => updatePref('comments_on_submissions', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Chat Messages</Label>
          <Switch
            checked={prefs.chat_messages}
            onCheckedChange={(v) => updatePref('chat_messages', v)}
          />
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 5: Testing & QA (3-4 days)

#### Testing Checklist

**Permission Flow:**
- [ ] Permission dialog appears
- [ ] Allow grants and registers token
- [ ] Block handles gracefully
- [ ] No repeated spam

**Token Management:**
- [ ] Token saves correctly
- [ ] Token updates on refresh
- [ ] Multiple devices work
- [ ] Expired tokens cleaned up

**Foreground Notifications:**
- [ ] Toast when app is open
- [ ] No duplicate native notification
- [ ] Click navigates correctly

**Background Notifications:**
- [ ] Native notification when closed
- [ ] Icon/badge display
- [ ] Click opens to correct page

**Cross-Platform:**
- [ ] Android Chrome
- [ ] Android Firefox
- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Desktop Chrome
- [ ] Desktop Firefox

**Preferences:**
- [ ] Disabled types don't send
- [ ] Test notification works
- [ ] Preferences persist

---

## Risk Mitigation

### Service Worker Conflicts (MEDIUM)
- Audit current service worker
- Use separate cache names
- Test all offline features
- Document architecture

### iOS Safari Quirks (MEDIUM)
- Test on real iOS devices
- Follow Apple guidelines
- Ensure HTTPS

### Token Management (LOW-MEDIUM)
- 60-day TTL cleanup
- Handle FCM errors
- User device management

---

## Timeline

| Phase | Duration |
|-------|----------|
| Foundation | 3-4 days |
| Token Registration | 2-3 days |
| Notification Sending | 3-4 days |
| User Preferences | 2 days |
| Testing & QA | 3-4 days |
| **Total** | **15-20 days** |

---

## Success Metrics

### Technical
- Token registration > 95%
- Message delivery > 90%
- Latency < 5 seconds
- Zero conflicts

### User
- 70%+ enable notifications
- 50%+ click-through
- < 10% unsubscribe

---

## Definition of Done

- [ ] Firebase project configured
- [ ] Database schema deployed
- [ ] Service worker tested
- [ ] Token registration working
- [ ] Edge function deployed
- [ ] All 5 triggers implemented
- [ ] Preferences UI complete
- [ ] Cross-platform testing done
- [ ] Zero critical bugs
- [ ] Documentation updated
- [ ] 70%+ adoption

---

**Status:** Ready for implementation  
**Next Action:** Create Firebase project
