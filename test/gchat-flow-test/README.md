# Google Chat Flow Test

Test the end-to-end flow: GChat card → tap button → complete form → see result.

## Quick Start

### Step 1: Deploy the Form (2 minutes)

**Option A: Vercel (recommended)**
```bash
cd test/gchat-flow-test
npx vercel --yes
```
Copy the URL it gives you (e.g., `https://gchat-flow-test-xxx.vercel.app`)

**Option B: Any static host**
Upload `index.html` to Netlify, Cloudflare Pages, or any static file host.

**Option C: Local testing with tunnel**
```bash
cd test/gchat-flow-test
npx serve .
# In another terminal:
npx localtunnel --port 3000
```

### Step 2: Create Webhook (Wife's Account)

1. Open chat.google.com in browser (not mobile)
2. Create a new space or use existing
3. Click space name → **Apps & integrations** → **Add webhooks**
4. Name: "Music League Test Bot"
5. Copy the webhook URL

### Step 3: Post Test Card

```bash
chmod +x post-to-gchat.sh
./post-to-gchat.sh "WEBHOOK_URL" "FORM_URL"
```

Replace:
- `WEBHOOK_URL` = the URL from Step 2
- `FORM_URL` = the URL from Step 1

### Step 4: Test the Flow

1. Check Google Chat - you should see the card
2. Tap "Play Now" button
3. Complete the 3 questions
4. See the fun fact result

## What You're Testing

- [ ] Card appears in chat correctly
- [ ] "Play Now" button is obvious and tappable
- [ ] Form loads quickly on mobile
- [ ] Questions are easy to understand
- [ ] Tap targets are big enough
- [ ] Result screen shows fun fact
- [ ] Whole flow takes < 60 seconds

## Customizing

Edit `index.html` to change:
- Song titles and artists (lines 230-250)
- Family member names (line 273)
- Fun facts (lines 320-325)
- Colors and styling (CSS at top)

## Files

- `index.html` - The form (single file, no dependencies)
- `post-to-gchat.sh` - Script to post test card
- `README.md` - This file
