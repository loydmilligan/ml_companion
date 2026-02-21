# OpenRouter Cost Tracking Implementation

**Generated:** 2026-02-21
**Project:** ml_companion
**Purpose:** Track all OpenRouter API calls with token usage and estimated costs

---

## Overview

This document describes the implementation of database-based cost tracking for all OpenRouter API calls in ml_companion. The system captures every API call, records token usage, calculates estimated costs, and stores the data for reporting and analysis.

### Why Cost Tracking?

1. **Budget visibility** - Know exactly how much AI features cost per group/user
2. **Usage patterns** - Identify which features consume the most tokens
3. **Rate limiting validation** - Verify daily limits are being enforced
4. **Anomaly detection** - Spot unexpected spikes in API usage
5. **Per-group billing** - Foundation for usage-based pricing if needed

---

## Files Created

### 1. Database Migration

**File:** `supabase/migrations/20260216_add_api_cost_tracking.sql`

Creates two tables for tracking API costs:

```sql
-- Track individual API calls with cost data
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,  -- 'openrouter-compare', 'openrouter-round-story', 'ai-assistant'
  mode TEXT,                    -- 'story', 'theme', 'validate_song', 'comparison', etc.
  model TEXT,                   -- 'anthropic/claude-3.5-sonnet', etc.
  provider TEXT,                -- 'Anthropic', 'OpenAI', etc.
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd NUMERIC(10, 6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily aggregates for reporting
CREATE TABLE IF NOT EXISTS api_cost_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  aggregate_date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, function_name, aggregate_date)
);
```

**Row Level Security (RLS):**
- Group members can only view their own group's API costs
- Service role (edge functions) can insert/update records
- Prevents cross-group data access

**Indexes:**
- `idx_api_calls_group_created` - Fast queries by group + date
- `idx_api_calls_user_created` - Fast queries by user + date
- `idx_api_calls_function` - Fast queries by function type

---

### 2. Shared Cost Tracking Utility

**File:** `supabase/functions/_shared/cost-tracker.ts`

A reusable module imported by all edge functions.

**Key exports:**

```typescript
// Extract cost data from OpenRouter response
export function extractCostData(response: OpenRouterResponse): CostData {
  const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const model = response.model || "unknown";

  return {
    model,
    provider: response.provider || null,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost_usd: calculateCost(model, usage),
  };
}

// Track a successful API call
export async function trackApiCall(
  supabase: SupabaseClient,
  response: OpenRouterResponse,
  params: {
    group_id?: string;
    user_id?: string;
    function_name: string;
    mode?: string;
  }
): Promise<CostData>

// Track a failed API call (for error monitoring)
export async function trackApiError(
  supabase: SupabaseClient,
  params: {
    group_id?: string;
    user_id?: string;
    function_name: string;
    mode?: string;
    model?: string;
    error_message: string;
  }
): Promise<void>
```

**Pricing table (per 1K tokens):**

```typescript
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "anthropic/claude-3.5-sonnet": { input: 0.003, output: 0.015 },
  "anthropic/claude-3-haiku": { input: 0.00025, output: 0.00125 },
  "anthropic/claude-3-opus": { input: 0.015, output: 0.075 },
  // OpenAI
  "openai/gpt-4o": { input: 0.005, output: 0.015 },
  "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  // Google
  "google/gemini-pro-1.5": { input: 0.00125, output: 0.005 },
  // Free tier
  "meta-llama/llama-3.1-8b-instruct:free": { input: 0, output: 0 },
  // Default fallback
  "default": { input: 0.001, output: 0.002 },
};
```

---

## Files Modified

### 1. ai-assistant/index.ts

**Import added:**
```typescript
import { trackApiCall, trackApiError, OpenRouterResponse } from "../_shared/cost-tracker.ts";
```

**Tracking added after each API call (4 locations):**

```typescript
// Example: explain_theme mode
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { /* ... */ },
  body: JSON.stringify({ /* ... */ }),
});

const json = await response.json() as OpenRouterResponse;

// NEW: Track the API call
await trackApiCall(supabase, json, {
  function_name: "ai-assistant",
  mode: "explain_theme",
  group_id: group_id,
  user_id: user?.id,
});
```

**Modes tracked:**
- `explain_theme`
- `validate_song`
- `generate_hint`
- `chat_response`

---

### 2. openrouter-compare/index.ts

**Import added:**
```typescript
import { trackApiCall, OpenRouterResponse } from "../_shared/cost-tracker.ts";
```

**Tracking added:**
```typescript
const json = await response.json() as OpenRouterResponse;

// NEW: Track the API call
await trackApiCall(supabase, json, {
  function_name: "openrouter-compare",
  mode: "comparison",
  group_id: group_id,
  user_id: user?.id,
});
```

---

### 3. openrouter-round-story/index.ts

**Import added:**
```typescript
import { trackApiCall, OpenRouterResponse } from "../_shared/cost-tracker.ts";
```

**Tracking added to 8 locations:**

| Location | Mode |
|----------|------|
| Text generation calls | `story`, `awards`, `season_awards`, `season_narrative`, `current_season_story`, `preseason_special` |
| Image generation calls | `theme_image`, `trophy_image`, `winners_image`, `story_image` |

**Example (generateImage helper):**
```typescript
async function generateImage(
  prompt: string,
  // ... other params
  supabase?: SupabaseClient,
  trackingParams?: { group_id?: string; user_id?: string; mode: string }
): Promise<string | null> {
  // ... fetch call ...

  const json = await response.json() as OpenRouterResponse;

  // NEW: Track image generation
  if (supabase && trackingParams) {
    await trackApiCall(supabase, json, {
      function_name: "openrouter-round-story",
      mode: trackingParams.mode,
      group_id: trackingParams.group_id,
      user_id: trackingParams.user_id,
    });
  }

  return imageUrl;
}
```

---

## Deployment Steps

### Prerequisites
- Supabase CLI installed and authenticated
- Access to the ml_companion Supabase project

### Step 1: Apply Database Migration

```bash
cd /home/mmariani/Projects/ml_companion
supabase db push
```

This will:
- Create the `api_calls` table
- Create the `api_cost_aggregates` table
- Create indexes for efficient querying
- Enable RLS policies

**Verify migration applied:**
```bash
supabase db diff
# Should show no pending changes
```

### Step 2: Deploy Edge Functions

Deploy all three modified functions:

```bash
supabase functions deploy ai-assistant
supabase functions deploy openrouter-compare
supabase functions deploy openrouter-round-story
```

Or deploy all at once:
```bash
supabase functions deploy ai-assistant openrouter-compare openrouter-round-story
```

### Step 3: Verify Deployment

**Check function logs:**
```bash
supabase functions logs ai-assistant --tail
```

**Trigger a test API call** (e.g., use the AI Assistant in the app to explain a theme)

**Query the tracking table:**
```sql
SELECT
  function_name,
  mode,
  model,
  prompt_tokens,
  completion_tokens,
  estimated_cost_usd,
  created_at
FROM api_calls
ORDER BY created_at DESC
LIMIT 5;
```

---

## Post-Deployment Tasks

### 1. Build a Cost Dashboard (Optional)

Add a new admin page or component to visualize costs:

```sql
-- Daily costs by function
SELECT
  DATE(created_at) as date,
  function_name,
  COUNT(*) as calls,
  SUM(total_tokens) as tokens,
  SUM(estimated_cost_usd) as cost_usd
FROM api_calls
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), function_name
ORDER BY date DESC, cost_usd DESC;

-- Costs by group
SELECT
  g.name as group_name,
  COUNT(*) as total_calls,
  SUM(a.estimated_cost_usd) as total_cost
FROM api_calls a
JOIN family_groups g ON a.group_id = g.id
WHERE a.created_at > NOW() - INTERVAL '30 days'
GROUP BY g.id, g.name
ORDER BY total_cost DESC;

-- Most expensive modes
SELECT
  function_name,
  mode,
  COUNT(*) as calls,
  AVG(total_tokens) as avg_tokens,
  SUM(estimated_cost_usd) as total_cost
FROM api_calls
GROUP BY function_name, mode
ORDER BY total_cost DESC;
```

### 2. Set Up Cost Alerts (Optional)

Create a database function to check for unusual spending:

```sql
CREATE OR REPLACE FUNCTION check_daily_cost_threshold()
RETURNS TRIGGER AS $$
DECLARE
  daily_cost NUMERIC;
  threshold NUMERIC := 10.00; -- $10/day alert
BEGIN
  SELECT SUM(estimated_cost_usd) INTO daily_cost
  FROM api_calls
  WHERE DATE(created_at) = CURRENT_DATE;

  IF daily_cost > threshold THEN
    -- Insert into an alerts table or call a webhook
    RAISE NOTICE 'Daily API cost threshold exceeded: $%', daily_cost;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Populate Daily Aggregates (Optional)

If you want to use the `api_cost_aggregates` table for faster reporting, create a scheduled function:

```sql
CREATE OR REPLACE FUNCTION aggregate_daily_costs()
RETURNS void AS $$
BEGIN
  INSERT INTO api_cost_aggregates (group_id, function_name, aggregate_date, total_calls, total_tokens, total_cost_usd)
  SELECT
    group_id,
    function_name,
    DATE(created_at) as aggregate_date,
    COUNT(*) as total_calls,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost_usd) as total_cost_usd
  FROM api_calls
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY group_id, function_name, DATE(created_at)
  ON CONFLICT (group_id, function_name, aggregate_date)
  DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    total_tokens = EXCLUDED.total_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4. Update Pricing Table

The pricing in `_shared/cost-tracker.ts` should be updated periodically as OpenRouter prices change. Check https://openrouter.ai/docs#models for current pricing.

---

## Troubleshooting

### No records appearing in api_calls

1. **Check function deployment:** `supabase functions list`
2. **Check function logs:** `supabase functions logs ai-assistant`
3. **Verify import path:** The import should be `"../_shared/cost-tracker.ts"`
4. **Check RLS policies:** Service role should have INSERT permission

### Incorrect cost estimates

1. **Model name mismatch:** Check that the model string from OpenRouter matches the pricing table keys
2. **Add missing models:** Update `MODEL_PRICING` in `cost-tracker.ts` with any new models

### Migration failed

1. **Check for conflicts:** `supabase db diff`
2. **Manual apply:** Copy SQL from migration file and run in Supabase SQL Editor

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database migration | ✅ Created | `20260216_add_api_cost_tracking.sql` |
| Cost tracker utility | ✅ Created | `_shared/cost-tracker.ts` |
| ai-assistant | ✅ Modified | 4 API calls tracked |
| openrouter-compare | ✅ Modified | 1 API call tracked |
| openrouter-round-story | ✅ Modified | 8 API calls tracked |
| Deployment | ⏳ Pending | Run `supabase db push` + `functions deploy` |
| Cost dashboard | 📋 Optional | Build after verifying tracking works |
