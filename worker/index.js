/**
 * Cloudflare Worker — OTP Proxy
 *
 * Endpoints:
 *   GET  /health        — liveness check
 *   POST /send          — generate OTP, store in KV, send via Fast2SMS
 *   POST /verify        — verify OTP, return sessionToken on success
 *
 * Secrets (set via: npx wrangler secret put FAST2SMS_API_KEY):
 *   FAST2SMS_API_KEY
 *
 * KV Bindings (wrangler.toml):
 *   OTP_STORE
 */

const ALLOWED_ORIGIN = "https://sunny-kathuria.github.io";
const OTP_TTL_SECONDS = 600; // 10 minutes

// ─── CORS helpers ────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:5173";
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

// ─── OTP helpers ─────────────────────────────────────────────────────────────

function generateOtp() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Map to range 100000–999999
  return String(100000 + (buf[0] % 900000));
}

function maskMobile(mobile) {
  return mobile.slice(0, 2) + "XXXXX" + mobile.slice(-3);
}

// ─── Fast2SMS ────────────────────────────────────────────────────────────────

async function sendSms(mobile, otp, apiKey) {
  const body = new URLSearchParams({
    route: "q",
    message: `Your OTP for mobile sale verification is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
    language: "english",
    flash: "0",
    numbers: mobile,
  });

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fast2SMS error ${res.status}: ${text}`);
  }
  return true;
}

// ─── Route handlers ──────────────────────────────────────────────────────────

async function handleSend(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { mobile } = body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return jsonResponse({ error: "Invalid mobile number. Must be 10 digits." }, 400);
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;

  // Store in KV with TTL so it auto-expires
  await env.OTP_STORE.put(
    `otp:${mobile}`,
    JSON.stringify({ otp, expiresAt }),
    { expirationTtl: OTP_TTL_SECONDS }
  );

  // Send SMS — log only masked mobile, never the OTP
  console.log(`Sending OTP to mobile ending in ${maskMobile(mobile)}`);
  await sendSms(mobile, otp, env.FAST2SMS_API_KEY);

  return jsonResponse({ success: true });
}

async function handleVerify(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { mobile, otp } = body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return jsonResponse({ error: "Invalid mobile number" }, 400);
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return jsonResponse({ error: "Invalid OTP format" }, 400);
  }

  const stored = await env.OTP_STORE.get(`otp:${mobile}`, { type: "json" });

  if (!stored) {
    return jsonResponse({ error: "OTP not found or already used" }, 400);
  }

  if (Date.now() > stored.expiresAt) {
    await env.OTP_STORE.delete(`otp:${mobile}`);
    return jsonResponse({ error: "OTP has expired. Please request a new one." }, 400);
  }

  if (otp !== stored.otp) {
    return jsonResponse({ error: "Incorrect OTP" }, 400);
  }

  // One-time use — delete immediately after successful verify
  await env.OTP_STORE.delete(`otp:${mobile}`);

  const sessionToken = crypto.randomUUID();
  console.log(`OTP verified for mobile ending in ${maskMobile(mobile)}`);

  return jsonResponse({ verified: true, sessionToken });
}

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || ALLOWED_ORIGIN;
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Health check
    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok" }, 200, origin);
    }

    // OTP send
    if (request.method === "POST" && url.pathname === "/send") {
      return await handleSend(request, env);
    }

    // OTP verify
    if (request.method === "POST" && url.pathname === "/verify") {
      return await handleVerify(request, env);
    }

    return jsonResponse({ error: "Not found" }, 404, origin);
  },
};
