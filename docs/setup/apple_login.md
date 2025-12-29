# Apple Login Setup (Supabase)

This guide explains how to enable “Sign in with Apple” for the Talking Music League app.

## Prerequisites
- **Apple Developer account** (paid). This is required by Apple to create the Service ID and signing key.
- Your Supabase project URL and project ref.

## Step-by-Step Setup

### 1) Create a Service ID
1. Apple Developer → **Certificates, Identifiers & Profiles**
2. **Identifiers → Service IDs → +**
3. Create a Service ID (example: `com.talkingmusicleague.web`)
4. Enable **Sign In with Apple** for the Service ID

### 2) Configure Web Domain + Return URL
In the Service ID settings:
- **Domain**: `talking.mattmariani.com`
- **Return URL** (Supabase callback):
  `https://wksntdtsqtxtsruewmuy.supabase.co/auth/v1/callback`

### 3) Create a Sign In with Apple Key
1. Apple Developer → **Keys → +**
2. Create a key and enable **Sign In with Apple**
3. Download the `.p8` private key file

You will need:
- **Key ID**
- **Team ID**
- **Services ID** (Client ID)
- **Private Key** (the `.p8` file contents)

### 4) Configure Supabase
Supabase → **Authentication → Providers → Apple**
- **Services ID** (Client ID)
- **Team ID**
- **Key ID**
- **Private Key** (paste contents of `.p8`)

Save the provider settings.

### 5) Test Login
- Open the app login screen
- Click **Continue with Apple ID**
- Complete Apple’s login flow

## Troubleshooting

### “Invalid client” or “redirect_uri mismatch”
- Your Service ID must list the exact domain and return URL.
- Confirm the Supabase callback URL matches:
  `https://wksntdtsqtxtsruewmuy.supabase.co/auth/v1/callback`

### “Unsupported_domain”
- Ensure your Service ID has the correct domain set (no protocol, just domain).

### “Invalid grant”
- The Team ID / Key ID / Private Key do not match.
- Recreate the key and update Supabase with the new values.

### Apple login button shows but fails silently
- Check Supabase **Auth logs** for details.
- Make sure the Apple provider is enabled and saved.

### No Apple Developer account
- You cannot enable Sign in with Apple without a paid developer account.
- In the meantime, hide the Apple button in the UI.

## Notes
- Apple enforces strict matching for domains and callback URLs.
- If you change your domain later, update both Apple and Supabase settings.
