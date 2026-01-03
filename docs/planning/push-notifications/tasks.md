# Push Notifications - Task Breakdown

**Branch:** `feature/firebase-push-notifications`
**Linear Issues:** [LOYD-129](https://linear.app/loydmilligan/issue/LOYD-129), [LOYD-130](https://linear.app/loydmilligan/issue/LOYD-130)
**Created:** 2026-01-03
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
| Add web app to Firebase project | User | [ ] | Get config credentials |
| Generate VAPID key for web push | User | [ ] | Project Settings → Cloud Messaging → Web Push certificates |
| Copy Firebase config credentials | User | [ ] | apiKey, authDomain, projectId, messagingSenderId, appId |
| Get Firebase Server Key for edge functions | User | [ ] | Project Settings → Cloud Messaging → Server key |

### 1.2 Environment Variables
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `.env.firebase.example` template | Claude | [ ] | Document required vars |
| Add Firebase env vars to local `.env` | User | [ ] | VITE_FIREBASE_* variables |
| Add FIREBASE_SERVER_KEY to Supabase secrets | User | [ ] | `supabase secrets set FIREBASE_SERVER_KEY=...` |

### 1.3 Install Dependencies
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Install firebase npm package | Claude | [ ] | `npm install firebase` |
| Verify package.json updated | Claude | [ ] | |

### 1.4 Service Worker Setup
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `firebase-messaging-sw.js` | Claude | [ ] | In `web/public/` |
| Add background message handler | Claude | [ ] | |
| Add notification click handler | Claude | [ ] | Deep link to correct page |
| Test for conflicts with existing SW | Claude | [ ] | Check PWA/caching |

### 1.5 Firebase Initialization
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `web/src/lib/firebase.ts` | Claude | [ ] | Firebase config & init |
| Export messaging instance | Claude | [ ] | |
| Add foreground message listener | Claude | [ ] | |

---

## Phase 2: Token Registration (2-3 days)

### 2.1 Database Schema
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `push_tokens` table migration | Claude | [ ] | |
| Apply migration to Supabase | User | [ ] | Or via MCP |
| Add RLS policies for push_tokens | Claude | [ ] | Users can only access own tokens |
| Test RLS policies | Claude | [ ] | |

### 2.2 Token Registration Hook
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `usePushNotifications.ts` hook | Claude | [ ] | |
| Implement `requestPermission()` | Claude | [ ] | Browser permission flow |
| Implement FCM token retrieval | Claude | [ ] | |
| Implement platform detection | Claude | [ ] | web/ios/android |
| Implement token save to Supabase | Claude | [ ] | Upsert to push_tokens |
| Handle permission denied gracefully | Claude | [ ] | |

### 2.3 Settings UI
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `PushNotificationToggle.tsx` | Claude | [ ] | |
| Add to SettingsDrawer | Claude | [ ] | |
| Show enabled/disabled state | Claude | [ ] | |
| Handle unsupported browsers | Claude | [ ] | |

---

## Phase 3: Notification Sending (3-4 days)

### 3.1 Edge Function
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `send-push-notification` function | Claude | [ ] | |
| Add JWT auth verification | Claude | [ ] | Reuse _shared/auth.ts |
| Implement user targeting (user_ids, group_id, round_id) | Claude | [ ] | |
| Implement FCM API call | Claude | [ ] | |
| Handle invalid token cleanup | Claude | [ ] | Remove stale tokens |
| Deploy edge function | User | [ ] | Via Supabase MCP or CLI |

### 3.2 Notification Triggers
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Trigger: New Round Created | Claude | [ ] | |
| Trigger: Deadline Reminder (24h) | Claude | [ ] | May need cron/scheduled function |
| Trigger: Results Revealed | Claude | [ ] | |
| Trigger: New Comment on submission | Claude | [ ] | |
| Trigger: Chat Message | Claude | [ ] | |

### 3.3 Foreground Handling
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create in-app toast for foreground notifications | Claude | [ ] | |
| Prevent duplicate native + toast | Claude | [ ] | |

---

## Phase 4: User Preferences (2 days)

### 4.1 Database Schema
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `notification_preferences` table migration | Claude | [ ] | |
| Apply migration | User | [ ] | |
| Add RLS policies | Claude | [ ] | |

### 4.2 Preferences UI
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Create `NotificationPreferences.tsx` | Claude | [ ] | |
| Add toggle for each notification type | Claude | [ ] | 5 types |
| Implement save to Supabase | Claude | [ ] | |
| Load existing preferences on mount | Claude | [ ] | |

### 4.3 Preference Checking
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Update edge function to check preferences | Claude | [ ] | Filter out disabled types |

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
| Test: Token saves correctly | User | [ ] | |
| Test: Token updates on refresh | User | [ ] | |
| Test: Multiple devices work | User | [ ] | |
| Test: Expired tokens cleaned up | Claude | [ ] | Verify cleanup logic |

### 5.3 Notification Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Foreground toast appears | User | [ ] | |
| Test: Background native notification | User | [ ] | |
| Test: Click navigates correctly | User | [ ] | |

### 5.4 Cross-Platform Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Android Chrome | User | [ ] | |
| Test: Android Firefox | User | [ ] | |
| Test: iOS Safari | User | [ ] | |
| Test: Desktop Chrome | User | [ ] | |
| Test: Desktop Firefox | User | [ ] | |

### 5.5 Preferences Testing
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Test: Disabled types don't send | User | [ ] | |
| Test: Preferences persist | User | [ ] | |

---

## Phase 6: Deployment & Cleanup

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| Deploy to Raspberry Pi | Claude | [ ] | Docker rebuild |
| Verify production notifications work | User | [ ] | |
| Update LOYD-129 status in Linear | Claude | [ ] | Mark complete |
| Update LOYD-130 status in Linear | Claude | [ ] | Mark complete (if iOS works) |
| Merge branch to main | Claude | [ ] | |
| Update issues.md | Claude | [ ] | Mark PN-001/PN-002 complete |
| Delete feature branch | Claude | [ ] | |

---

## Current Focus

**Next Action:** User to create Firebase project and get credentials

**Blocked:** Claude tasks in Phase 1.3+ waiting on Firebase credentials

---

## Summary

| Phase | Total Tasks | User Tasks | Claude Tasks |
|-------|-------------|------------|--------------|
| 1. Foundation | 15 | 8 | 7 |
| 2. Token Registration | 13 | 1 | 12 |
| 3. Notification Sending | 11 | 1 | 10 |
| 4. User Preferences | 8 | 1 | 7 |
| 5. Testing & QA | 14 | 12 | 2 |
| 6. Deployment | 7 | 1 | 6 |
| **Total** | **68** | **24** | **44** |
