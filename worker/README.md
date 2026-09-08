# Cloudflare Worker — OTP Proxy

## What this does

Handles OTP generation and delivery for the Mobile Store PWA. Keeps the Fast2SMS API key secure — the frontend never sees it.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/send` | Generate OTP and send via Fast2SMS |
| POST | `/verify` | Verify OTP, return sessionToken |

## First-time setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
npx wrangler login
```

### 2. Create KV namespace

```bash
# Production namespace
npx wrangler kv:namespace create OTP_STORE

# Preview namespace (for local dev)
npx wrangler kv:namespace create OTP_STORE --preview
```

Copy the `id` and `preview_id` values into `wrangler.toml`.

### 3. Set the Fast2SMS API key as a secret

```bash
npx wrangler secret put FAST2SMS_API_KEY
# Paste your Fast2SMS API key when prompted — it is never stored in code
```

### 4. Deploy

```bash
npx wrangler deploy
```

After deploy, Wrangler prints your Worker URL (e.g. `https://otp-proxy.your-account.workers.dev`).
Copy this URL and add it as the `VITE_WORKER_URL` secret in your GitHub repository settings.

## Local development

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your real Fast2SMS API key

npx wrangler dev
# Worker runs on http://localhost:8787
```

Update `frontend/.env.local`:
```
VITE_WORKER_URL=http://localhost:8787
```
