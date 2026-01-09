# Quick Start Guide

**Version**: 0.2.0 | **Last Updated**: January 2025

Get Talking Music League running quickly with this guide.

## Prerequisites

- Node.js 20+ and npm
- Supabase account and project
- Git access to the repository

## 1. Clone and Install

```bash
git clone <repository-url>
cd ml_companion/web
npm install
```

## 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these values in Supabase → Settings → API.

## 3. Database Setup

Run the database migrations. In Supabase SQL Editor, execute the migration files from `supabase/migrations/` in order.

Key tables that must exist:
- `profiles` (extends auth.users)
- `groups`, `group_members`
- `leagues`, `rounds`, `submissions`
- `chat_messages`, `reactions`
- `group_settings`

## 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 5. First User Setup

1. Click "Sign in with Google" or "Sign in with Apple"
2. Complete the onboarding flow to create your profile
3. Create a new group or join via invite code

## 6. Admin Configuration

As the group lead:

1. Go to **Admin** page
2. Create a **League** (Season 1 of your Music League)
3. Add **Competitors** (roster of players)
4. Import or create **Rounds**

## Next Steps

### Deploy to Production

See the [Deployment Architecture](../architecture/overview.md#deployment-architecture) section.

```bash
# Build production bundle
npm run build

# Deploy to Raspberry Pi
git push
ssh pi "cd ml_companion && git pull && docker compose down && docker compose build && docker compose up -d"
```

### Enable Push Notifications

1. Set up Firebase project and get FCM credentials
2. Configure Supabase secrets:
   ```bash
   supabase secrets set FCM_PROJECT_ID=... FCM_SERVICE_ACCOUNT_EMAIL=... FCM_PRIVATE_KEY=...
   ```
3. Deploy the `send-push-notification` edge function

### Enable AI Features

1. Get OpenRouter API key
2. Configure Supabase secrets:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=... OPENROUTER_MODEL=...
   ```
3. Deploy edge functions:
   ```bash
   supabase functions deploy openrouter-compare openrouter-round-story ai-assistant round-challenge --no-verify-jwt
   ```

### Set Up Email Ingestion

See [n8n Email Ingestion](../integrations/n8n_email_ingestion.md) for automatic activity tracking.

## Troubleshooting

### Auth not working

- Verify Supabase Auth providers are configured (Google, Apple)
- Check redirect URLs match your domain
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct

### Database errors

- Run all migrations in order
- Check RLS policies allow your operations
- Verify foreign key relationships

### Build fails

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (need 20+)
- Review TypeScript errors: `npm run build 2>&1 | head -50`

### Push notifications not working

- Verify Firebase config in `.env`
- Check service worker registration in browser DevTools
- Test FCM token generation in Settings page

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Edge Functions Setup](edge_functions.md)
- [Admin Settings Guide](../admin/admin_settings.md)
