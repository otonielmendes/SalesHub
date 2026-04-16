import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const APP_ORIGIN = process.env.QA_APP_ORIGIN || "http://localhost:3000";
const PASSWORD = `Qa-demo-security-${Date.now()}!`;
const EMAIL = `qa-demo-security-${Date.now()}@otnl.com.br`;

function loadDotenvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] ||= value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildSignals(label) {
  return {
    sessionId: `qa-session-${label}`,
    deviceId: `qa-device-${label}`,
    capturedAt: new Date().toISOString(),
    session: {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36",
      os: "MacIntel",
      osVersion: "MacIntel",
      platform: "MacIntel",
      lang: "pt-BR",
      timezone: -3,
      timezoneName: "America/Sao_Paulo",
      browsingUrl: `${APP_ORIGIN}/demo/qa`,
      screen: {
        width: 1440,
        height: 900,
        availWidth: 1440,
        availHeight: 860,
        availLeft: 0,
        availTop: 0,
        colorDepth: 24,
        orientation: "landscape-primary",
      },
      cpuSpeed: {
        average: 24.8,
        time: 10,
        version: 1,
      },
      plugins: "Chrome PDF Viewer, Chromium PDF Viewer",
      sessionStorage: true,
      localStorage: true,
      indexedDB: true,
      cookiesEnabled: true,
      doNotTrack: false,
      canvasId: `qa-canvas-${label}`,
      gpuVendor: "Google Inc. (Apple)",
      gpuName: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)",
      cores: 12,
      deviceMemory: 8,
      devicePixelRatio: 2,
      privateBrowsing: false,
      acceptContent: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      javaEnabled: false,
      javaScriptEnabled: true,
    },
  };
}

async function createQaUser(admin) {
  const authResult = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: "QA Demo Security" },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(`Failed to create auth user: ${authResult.error?.message}`);
  }

  const user = authResult.data.user;
  const profileResult = await admin.from("users").upsert({
    id: user.id,
    email: EMAIL,
    name: "QA Demo Security",
    role: "user",
    status: "active",
  });

  if (profileResult.error) {
    await admin.auth.admin.deleteUser(user.id);
    throw new Error(`Failed to create public user: ${profileResult.error.message}`);
  }

  return user.id;
}

async function cleanupQaUser(admin, userId) {
  await admin.from("demo_sessions").delete().eq("user_id", userId);
  await admin.from("users").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
}

async function createSession(admin, userId, session) {
  const result = await admin
    .from("demo_sessions")
    .insert({ user_id: userId, ...session })
    .select("id, share_token")
    .single();

  if (result.error || !result.data) {
    throw new Error(`Failed to create demo session: ${result.error?.message}`);
  }

  return result.data;
}

async function postCapture(token, signals) {
  return fetch(`${APP_ORIGIN}/api/demo/capture`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-vercel-ip-country": "BR",
      "x-vercel-ip-country-region": "SP",
      "x-vercel-ip-city": "Sao%20Paulo",
      "x-vercel-ip-timezone": "America%2FSao_Paulo",
    },
    body: JSON.stringify({ token, signals }),
  });
}

async function main() {
  loadDotenvLocal();

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = null;

  try {
    const health = await fetch(`${APP_ORIGIN}/login`);
    assert(health.ok, `App is not reachable at ${APP_ORIGIN}. Start the dev server or set QA_APP_ORIGIN.`);

    userId = await createQaUser(admin);

    const futureAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const expiredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const pending = await createSession(admin, userId, {
      prospect_name: "QA Security Pending",
      status: "pending",
      expires_at: futureAt,
    });
    const expired = await createSession(admin, userId, {
      prospect_name: "QA Security Expired",
      status: "pending",
      expires_at: expiredAt,
    });
    const captured = await createSession(admin, userId, {
      prospect_name: "QA Security Captured",
      status: "captured",
      expires_at: futureAt,
      signals_json: buildSignals("original"),
      insights_json: { riskScore: 100, riskLevel: "low", summary: "Original", capturedAt: new Date().toISOString(), verdictCards: [] },
    });

    const anonRead = await anon
      .from("demo_sessions")
      .select("id, share_token")
      .eq("share_token", pending.share_token);
    assert(!anonRead.error, `Anon select returned unexpected error: ${anonRead.error?.message}`);
    assert(Array.isArray(anonRead.data) && anonRead.data.length === 0, "Anon key can read demo_sessions by share_token.");

    const expiredResponse = await postCapture(expired.share_token, buildSignals("expired"));
    assert(expiredResponse.status === 410, `Expired token returned ${expiredResponse.status}, expected 410.`);

    const expiredReload = await admin
      .from("demo_sessions")
      .select("status")
      .eq("id", expired.id)
      .single();
    assert(expiredReload.data?.status === "expired", "Expired session was not marked expired by capture API.");

    const alreadyResponse = await postCapture(captured.share_token, buildSignals("rewrite"));
    const alreadyBody = await alreadyResponse.json();
    assert(alreadyResponse.status === 200, `Captured token returned ${alreadyResponse.status}, expected 200.`);
    assert(alreadyBody.ok === true && alreadyBody.already === true, "Captured token did not return already=true.");

    const capturedReload = await admin
      .from("demo_sessions")
      .select("status, signals_json")
      .eq("id", captured.id)
      .single();
    assert(capturedReload.data?.status === "captured", "Captured session status changed unexpectedly.");
    assert(
      capturedReload.data?.signals_json?.deviceId === "qa-device-original",
      "Captured session signals were overwritten by a second capture.",
    );

    const missingResponse = await postCapture("00000000-0000-4000-8000-000000000000", buildSignals("missing"));
    assert(missingResponse.status === 404, `Missing token returned ${missingResponse.status}, expected 404.`);

    const result = {
      ok: true,
      checks: {
        anonCannotReadDemoSessions: true,
        expiredTokenReturns410: true,
        expiredTokenMarksSessionExpired: true,
        capturedTokenIsIdempotent: true,
        missingTokenReturns404: true,
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (userId) await cleanupQaUser(admin, userId);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
