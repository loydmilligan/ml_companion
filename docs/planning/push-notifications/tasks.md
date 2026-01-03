# Push Notifications - Task Breakdown

**Branch:** `feature/firebase-push-notifications`
**Linear Issues:** [LOYD-129](https://linear.app/loydmilligan/issue/LOYD-129), [LOYD-130](https://linear.app/loydmilligan/issue/LOYD-130)
**Created:** 2026-01-03
**Updated:** 2026-01-03 (FCM v1 API)
**Status:** In Progress

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[B]` | Blocked |
| **Owner: User** | Requires manual action in Firebase/Supabase console |
| **Owner: Claude** | Can be implemented via code |

---

## Phase 1: Foundation (3-4 days)

### 1.1 Firebase Project Setup
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create Firebase project at console.firebase.google.com | User | [ ] | Name: `talking-music-league` |
| Enable Cloud Messaging API | User | [ ] | In Firebase Console → Project Settings |
| Add web app to Firebase project | User | [ ] | Get config credentials (apiKey, authDomain, etc.) |
| Generate VAPID key for web push | User | [ ] | Project Settings → Cloud Messaging → Web Push certificates |
| Generate service account JSON | User | [ ] | Project Settings → Service accounts → Generate new private key |
| Extract values from service account JSON | User | [ ] | project_id, client_email, private_key |

### 1.2 Environment Variables
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Update `.env.example` with Firebase vars | Claude | [x] | Already done |
| Add VITE_FIREBASE_* vars to local `.env` | User | [ ] | Frontend config |
| Add VITE_FIREBASE_VAPID_KEY to `.env` | User | [ ] | From web push certificates |
| Set FIREBASE_PROJECT_ID in Supabase secrets | User | [ ] | `supabase secrets set` |
| Set FIREBASE_CLIENT_EMAIL in Supabase secrets | User | [ ] | `supabase secrets set` |
| Set FIREBASE_PRIVATE_KEY in Supabase secrets | User | [ ] | Preserve newlines! |

### 1.3 Install Dependencies
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Install firebase npm package | Claude | [ ] | `npm install firebase` |
| Verify package.json updated | Claude | [ ] | firebase ^10.7.1 |

### 1.4 Service Worker Setup
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `firebase-messaging-sw.js` | Claude | [ ] | In `web/public/` |
| Add Firebase config to service worker | Claude | [ ] | Must be hardcoded (no env vars in SW) |
| Add background message handler | Claude | [ ] | `onBackgroundMessage` |
| Add notification click handler | Claude | [ ] | Deep link to correct page |
| Test for conflicts with existing SW | Claude | [ ] | Check PWA/caching |

### 1.5 Firebase Client Initialization
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `web/src/lib/firebase.ts` | Claude | [ ] | Firebase config & init |
| Export messaging instance | Claude | [ ] | |
| Add foreground message listener | Claude | [ ] | `onMessage` handler |
| Handle missing env vars gracefully | Claude | [ ] | Don't crash if Firebase not configured |

---

## Phase 2: Token Registration (2-3 days)

### 2.1 Database Schema
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `push_tokens` table migration | Claude | [ ] | |
| Add indexes for user_id, token, last_used_at | Claude | [ ] | |
| Add RLS policies for push_tokens | Claude | [ ] | Users can only access own tokens |
| Apply migration to Supabase | Claude | [ ] | Via MCP |

### 2.2 Token Registration Hook
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `usePushNotifications.ts` hook | Claude | [ ] | |
| Implement `requestPermission()` | Claude | [ ] | Browser permission flow |
| Implement FCM token retrieval | Claude | [ ] | Using VAPID key |
| Implement platform detection | Claude | [ ] | web/ios/android |
| Implement token save to Supabase | Claude | [ ] | Upsert to push_tokens |
| Handle permission denied gracefully | Claude | [ ] | |
| Handle unsupported browsers | Claude | [ ] | Safari desktop, older browsers |

### 2.3 Settings UI
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `PushNotificationToggle.tsx` | Claude | [ ] | |
| Add to SettingsDrawer | Claude | [ ] | |
| Show enabled/disabled state | Claude | [ ] | |
| Show "not supported" message when needed | Claude | [ ] | |

---

## Phase 3: Notification Sending - FCM v1 API (3-4 days)

### 3.1 Edge Function
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `send-push-notification` function dir | Claude | [ ] | |
| Implement OAuth2 token generation | Claude | [ ] | JWT signing with private key |
| Implement `pemToArrayBuffer` helper | Claude | [ ] | Parse PEM private key |
| Implement `sendFCMNotification` function | Claude | [ ] | FCM v1 API call |
| Add JWT auth verification | Claude | [ ] | Reuse _shared/auth.ts |
| Implement user targeting (user_ids, group_id, round_id) | Claude | [ ] | |
| Implement preference checking | Claude | [ ] | Filter by notification_type |
| Handle invalid token cleanup | Claude | [ ] | Remove stale tokens on NOT_FOUND |
| Deploy edge function | Claude | [ ] | Via Supabase MCP |

### 3.2 Notification Triggers
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Trigger: New Round Created | Claude | [ ] | When admin creates round |
| Trigger: Deadline Reminder (24h) | Claude | [ ] | Needs scheduled job or manual trigger |
| Trigger: Results Revealed | Claude | [ ] | When round status → revealed |
| Trigger: New Comment on submission | Claude | [ ] | When comment inserted |
| Trigger: Chat Message | Claude | [ ] | When group_message inserted |

### 3.3 Foreground Handling
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create in-app toast for foreground notifications | Claude | [ ] | |
| Prevent duplicate native + toast | Claude | [ ] | |
| Add click handler to navigate | Claude | [ ] | |

---

## Phase 4: User Preferences (2 days)

### 4.1 Database Schema
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `notification_preferences` table migration | Claude | [ ] | |
| Add RLS policies | Claude | [ ] | |
| Apply migration | Claude | [ ] | Via MCP |

### 4.2 Preferences UI
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `NotificationPreferences.tsx` | Claude | [ ] | |
| Add toggle: New Rounds | Claude | [ ] | Default: on |
| Add toggle: Deadline Reminders | Claude | [ ] | Default: on |
| Add toggle: Results Revealed | Claude | [ ] | Default: on |
| Add toggle: Comments on Submissions | Claude | [ ] | Default: on |
| Add toggle: Chat Messages | Claude | [ ] | Default: off |
| Implement save to Supabase | Claude | [ ] | Upsert on change |
| Load existing preferences on mount | Claude | [ ] | |

---

## Phase 5: Testing & QA (3-4 days)

### 5.1 Permission Flow Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Permission dialog appears | User | [ ] | |
| Test: Allow grants and registers token | User | [ ] | |
| Test: Block handles gracefully | User | [ ] | |
| Test: No repeated permission spam | User | [ ] | |

### 5.2 Token Management Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Token saves to push_tokens table | User | [ ] | Check Supabase |
| Test: Token updates on app revisit | User | [ ] | |
| Test: Multiple devices work | User | [ ] | Same user, different tokens |
| Test: Expired/invalid tokens cleaned up | User | [ ] | After failed send |

### 5.3 Notification Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Foreground toast appears | User | [ ] | App in focus |
| Test: Background native notification | User | [ ] | App not in focus |
| Test: Click navigates correctly | User | [ ] | Deep link works |
| Test: Notification icon/badge correct | User | [ ] | |

### 5.4 Cross-Platform Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Android Chrome | User | [ ] | Primary target |
| Test: Android Firefox | User | [ ] | |
| Test: iOS Safari | User | [ ] | May have quirks |
| Test: Desktop Chrome | User | [ ] | |
| Test: Desktop Firefox | User | [ ] | |

### 5.5 Preferences Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Disabled types don't send | User | [ ] | |
| Test: Preferences persist on reload | User | [ ] | |
| Test: New user gets defaults | User | [ ] | |

---

## Phase 6: Deployment & Cleanup

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Update Firebase config in service worker for prod | Claude | [ ] | Hardcoded values |
| Deploy to Raspberry Pi | Claude | [ ] | Docker rebuild |
| Verify production notifications work | User | [ ] | Real device test |
| Update LOYD-129 status in Linear | Claude | [ ] | Mark complete |
| Update LOYD-130 status in Linear | Claude | [ ] | Mark complete (if iOS works) |
| Merge branch to main | Claude | [ ] | |
| Update issues.md | Claude | [ ] | Mark PN-001/PN-002 complete |
| Delete feature branch | Claude | [ ] | |

---

## Current Focus

**Blocked on User:**
- Firebase project creation
- Service account generation
- Supabase secrets configuration

**Next User Actions:**
1. Create Firebase project
2. Add web app & get config
3. Generate VAPID key
4. Generate service account JSON
5. Set Supabase secrets (3 values)

**Once unblocked, Claude can:**
- Install Firebase SDK
- Create service worker
- Create firebase.ts initialization
- Create database migrations
- Create edge function

---

## Summary

| Phase | Total Tasks | User Tasks | Claude Tasks |
|-------|-------------|------------|--------------|
| 1. Foundation | 17 | 9 | 8 |
| 2. Token Registration | 14 | 0 | 14 |
| 3. Notification Sending (v1 API) | 14 | 0 | 14 |
| 4. User Preferences | 11 | 0 | 11 |
| 5. Testing & QA | 17 | 17 | 0 |
| 6. Deployment | 8 | 1 | 7 |
| **Total** | **81** | **27** | **54** |

---

## FCM v1 API Notes

**Key Differences from Legacy:**
- No batch sending (must send individually per token)
- OAuth2 tokens expire after 1 hour (auto-refresh in code)
- Endpoint: `https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`
- Requires service account (not server key)

**Service Account Secrets Needed:**
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
