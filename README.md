# Mobile Store PWA

A Progressive Web App for legally recording second-hand phone purchases.
Customers verify their identity via OTP and Aadhaar photo.
All data is stored locally in the browser and syncs to Google Drive.

**Live URL:** https://sunny-kathuria.github.io/mobile-store-pwa/

---

## Architecture

```
Browser (PWA)
  ├── IndexedDB  ← all transaction data + image blobs
  └── Google Drive API ← cloud backup via OAuth

Cloudflare Worker (otp-proxy)
  └── Fast2SMS  ← sends OTP SMS to customers
```

---

## One-time Setup (do this before first deploy)

### Step 1 — Cloudflare Worker (OTP proxy)

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Log in to Cloudflare
npx wrangler login

# 3. Go into the worker directory
cd worker

# 4. Create KV namespace (copy the id printed)
npx wrangler kv:namespace create OTP_STORE
npx wrangler kv:namespace create OTP_STORE --preview

# 5. Paste BOTH ids into wrangler.toml replacing the placeholder values

# 6. Set your Fast2SMS API key as a secret (paste when prompted)
npx wrangler secret put FAST2SMS_API_KEY

# 7. Deploy the worker
npx wrangler deploy
# → Copy the printed Worker URL, e.g. https://otp-proxy.sunny-kathuria.workers.dev
```

### Step 2 — GitHub Repository Secrets

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|---|---|
| `VITE_WORKER_URL` | Your Cloudflare Worker URL from Step 1 |
| `VITE_GOOGLE_CLIENT_ID` | `310659409102-1crhibfnk2ccg7tj5v98ibssbcuhuiqd.apps.googleusercontent.com` |

### Step 3 — Google OAuth Authorized Origin

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Open **APIs & Services → Credentials** and select the OAuth client used by `VITE_GOOGLE_CLIENT_ID`
3. Make sure its application type is **Web application**
4. Add `https://sunny-kathuria.github.io` to **Authorized JavaScript origins**
5. Do not add `/mobile-store-pwa` to the origin; paths are not valid here
6. Save, then reload the app and connect Google Drive again

### Step 4 — Google OAuth Consent Screen

If Google says the app has not completed verification, the OAuth consent screen
is still in testing. For private testing:

1. In Google Cloud Console, open **Google Auth Platform → Audience**
  (or **APIs & Services → OAuth consent screen** in the older interface)
2. Set the app's publishing status to **Testing**
3. Under **Test users**, add the exact Google account that will connect Drive
4. Save, then sign in again with that test account

Only test users can authorize an app while it is in testing. For a public app,
publish the consent screen and complete Google's verification process if Google
requires it. The app requests the `drive.file` scope, which limits access to
files created by this app.

### Step 5 — Enable GitHub Pages

1. Push code to the `main` branch
2. Wait for the GitHub Actions workflow to complete (check Actions tab)
3. Go to repo Settings → Pages → Source: **GitHub Actions**
4. Your app is live at `https://sunny-kathuria.github.io/mobile-store-pwa/`

---

## Local Development

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Worker URL

npm install
npm run dev
# → http://localhost:5173/mobile-store-pwa/
```

### Cloudflare Worker

```bash
cd worker
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Fast2SMS API key

npx wrangler dev
# → http://localhost:8787
```

Set `VITE_WORKER_URL=http://localhost:8787` in `frontend/.env.local` for local testing.
To test the wizard without sending SMS, add `VITE_TEST_OTP=123456` to
`frontend/.env.local`. In this mode, sending is simulated and `123456` is the
only accepted OTP. Remove the variable before building a production release.

---

## App Flow

1. **PIN Lock** — Staff enter 4-digit PIN to unlock
2. **Step 1** — Enter customer mobile number → OTP sent via Fast2SMS
3. **Step 2** — Customer enters OTP (legal consent to sell)
4. **Step 3** — Fill customer details (Name, DOB, Email, Address, Aadhaar No., IMEI)
5. **Step 4** — Photograph Aadhaar card (front + back)
6. **Step 5** — Take selfie of seller → Submit
7. **Success** — Record saved locally; syncs to Drive if connected

**Settings** (gear icon, PIN-protected):
- Connect / disconnect Google Drive
- View all transaction history
- Manual sync trigger
- Change PIN

---

## Security

| Rule | How |
|---|---|
| Fast2SMS key never in frontend | Cloudflare Worker secret only |
| Secure OTP generation | `crypto.getRandomValues()` in Worker |
| OTP one-time use | KV entry deleted on verify |
| PIN stored as hash | SHA-256 via Web Crypto, never plaintext |
| Aadhaar field masked | Toggle-mask input |
| Drive scope minimal | `drive.file` — app only sees its own files |
| Access token in memory only | Never persisted to storage |
