# Supabase Setup (Talking Music League)

This walkthrough sets up Supabase auth, database schema, and RLS policies for the web app.

## 1) Create a Supabase Project
- Go to Supabase and create a new project.
- Save the project URL and anon key.

## 2) Configure Authentication
- In **Authentication → Providers** enable:
  - Email/Password
  - Google (OAuth)
- In **Authentication → URL Configuration** set:
  - Site URL: `http://localhost:5173`
  - Add additional redirect URLs for production when ready.

## 3) Apply the Database Schema
- Open **SQL Editor** and run the contents of `supabase/schema.sql`.
- If you already ran the schema before, apply the delta additions (profiles columns, votes, season competitors, group messages, invites).
- New: `season_round_comments` stores per-round chat for Season 1 rounds.

## 4) Enable Row Level Security (RLS)
- RLS controls which rows a logged-in user can read or write.
- Run the contents of `supabase/rls.sql` in the SQL Editor.
- This includes the `accept_invite` function used by invite links.

## 5) Create OAuth Credentials (Google)
- In Google Cloud Console, create OAuth credentials.
- Add the Supabase callback URL shown in the Supabase provider settings.
- Paste the client ID and secret into Supabase.

## 6) Seed Your First User (Optional)
- Sign up via the app to create your first profile row.
- The app creates a profile automatically on first login.

## 7) Confirm Data Access
- After signing in, create a family group in the onboarding flow.
- Verify the `family_groups` and `group_members` tables show your new records.

## Reference Files
- Schema: `supabase/schema.sql`
- RLS policies: `supabase/rls.sql`
