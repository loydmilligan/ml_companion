# Supabase Edge Functions Setup

This project uses Supabase Edge Functions for:
- OpenRouter song-connection summaries
- Notifications (ntfy + optional Gmail SMTP)

## 1) Install Supabase CLI
- Follow Supabase CLI install instructions for your OS.
- Verify:

```bash
supabase --version
```

## 2) Login and Link the Project
From the repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

You can find the project ref in Supabase → Project Settings → General.

## 3) Set Edge Function Secrets
Copy values from `supabase/.env.example` and set them as Supabase secrets:

```bash
supabase secrets set OPENROUTER_API_KEY=... OPENROUTER_MODEL=...

supabase secrets set NTFY_SERVER_URL=... NTFY_TOPIC=... \
  NTFY_USERNAME=... NTFY_PASSWORD=...

supabase secrets set SMTP_USERNAME=... SMTP_PASSWORD=... SMTP_FROM_EMAIL=...
```

## 4) Deploy the Functions
```bash
supabase functions deploy openrouter-compare
supabase functions deploy notify
```

## 5) Confirm Function URLs
In Supabase → Edge Functions, copy the function URL. The client uses `supabase.functions.invoke()` so no additional config is required.

## 6) Create the Avatars Storage Bucket
In Supabase → Storage:
- Create a bucket named `avatars` (public bucket).
- Add a policy to allow authenticated users to upload.

Suggested policy (SQL editor):

```sql
create policy "Avatar uploads" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "Avatar reads" on storage.objects
  for select
  using (bucket_id = 'avatars');
```
