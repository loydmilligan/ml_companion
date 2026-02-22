# ml_companion OpenRouter Cost Tracking Implementation

**Generated:** 2026-02-21
**Project:** ml_companion (Supabase Edge Functions)
**Target:** ManageMe webhook-based cost tracking

---

## Overview

This document describes how to implement OpenRouter API cost tracking for the ml_companion project. The tracking uses a webhook approach where all API calls POST cost data to a central ManageMe endpoint.

---

## Architecture

```
ml_companion (Supabase Edge Functions)
    │
    │  POST /api/costs/log
    │  {project, function_name, mode, model, tokens, cost...}
    │
    ▼
ManageMe (Next.js)
    │
    ▼
Database (AICost table)
```

---

## Files Already Modified

These changes have been made locally but **need to be deployed**:

### 1. Cost Tracker Module (Updated)

**File:** `supabase/functions/_shared/cost-tracker.ts`

**Changes:**
- Removed Supabase database dependency
- Added webhook POST to ManageMe
- Kept backward-compatible function signatures
- Added `MANAGEME_WEBHOOK_URL` configuration

**Key function:**
```typescript
export async function trackApiCall(
  supabase,  // ignored for backward compatibility
  response: OpenRouterResponse,
  params: { function_name: string; mode?: string; group_id?: string; user_id?: string }
): Promise<CostData>
```

### 2. Project Configuration (Updated)

**File:** `.openrouter-project.json`

```json
{
  "project": "ml_companion",
  "description": "Music League companion app with AI features",
  "cost_tracking": "webhook",
  "webhook_url": "http://localhost:3000/api/costs/log",
  "functions_tracked": [
    "openrouter-compare",
    "openrouter-round-story",
    "ai-assistant",
    "round-challenge"
  ]
}
```

---

## What Needs To Be Done

### Step 1: Configure Webhook URL

The webhook URL must be accessible from Supabase's cloud. Options:

**Option A: Use a tunnel (for development)**
```bash
# Start ngrok or similar
ngrok http 3000

# Get the public URL, e.g., https://abc123.ngrok.io
```

**Option B: Deploy ManageMe publicly**

If ManageMe is deployed (e.g., on Vercel, Railway, etc.), use that URL.

### Step 2: Set Supabase Secret

```bash
cd /home/mmariani/Projects/ml_companion

# Set the webhook URL as a Supabase secret
supabase secrets set MANAGEME_WEBHOOK_URL=https://your-manageme-url.com/api/costs/log
```

### Step 3: Deploy Edge Functions

```bash
cd /home/mmariani/Projects/ml_companion

# Deploy all functions that use cost tracking
supabase functions deploy ai-assistant
supabase functions deploy openrouter-compare
supabase functions deploy openrouter-round-story
```

### Step 4: Add Tracking to round-challenge (Optional)

The `round-challenge` function currently has NO cost tracking. To add it:

**File:** `supabase/functions/round-challenge/index.ts`

**Add import:**
```typescript
import { trackApiCall, OpenRouterResponse } from "../_shared/cost-tracker.ts";
```

**After each OpenRouter call (around lines 205 and 286), add:**
```typescript
const json = await response.json() as OpenRouterResponse;

// Track the API call
await trackApiCall(null, json, {
  function_name: "round-challenge",
  mode: "get_or_generate",  // or "regenerate" for the second call
});
```

---

## Verification

### Test the webhook is working:

1. Start ManageMe locally: `npm run dev`

2. Make a test POST:
```bash
curl -X POST http://localhost:3000/api/costs/log \
  -H "Content-Type: application/json" \
  -d '{
    "project": "ml_companion",
    "function_name": "test",
    "model": "anthropic/claude-3.5-sonnet",
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150,
    "cost": 0.001
  }'
```

3. Check the response: `{"success":true,"id":"...","project":"ml_companion","amount":0.001}`

4. Verify in database or via GET:
```bash
curl http://localhost:3000/api/costs/log?project=ml_companion
```

### Test from ml_companion:

1. Ensure ManageMe is accessible (tunnel or deployed)
2. Set the secret: `supabase secrets set MANAGEME_WEBHOOK_URL=<url>`
3. Deploy functions: `supabase functions deploy ai-assistant`
4. Make an AI call in ml_companion (e.g., explain a theme)
5. Check ManageMe's `/api/costs/log` endpoint

---

## Edge Functions with Tracking

| Function | Modes | Tracking Status |
|----------|-------|-----------------|
| `ai-assistant` | explain_theme, validate_song, generate_hint, chat_response | ✅ Implemented |
| `openrouter-compare` | comparison | ✅ Implemented |
| `openrouter-round-story` | story, theme_image, awards, season_awards, etc. | ✅ Implemented |
| `round-challenge` | get_or_generate, regenerate | ✅ Implemented |

---

## Rollback

If you need to revert to the old database-based tracking:

1. Restore the old `_shared/cost-tracker.ts` from git
2. Redeploy the functions
3. Ensure the `api_calls` table exists in Supabase

---

## Summary Checklist

- [x] Set `MANAGEME_WEBHOOK_URL` in Supabase secrets
- [x] Deploy `ai-assistant` function
- [x] Deploy `openrouter-compare` function
- [x] Deploy `openrouter-round-story` function
- [x] Add tracking to `round-challenge`
- [x] Verify costs appear in ManageMe

**Completed:** 2026-02-22
