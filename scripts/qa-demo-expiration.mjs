import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PASSWORD = `Qa-demo-expiration-${Date.now()}!`;
const EMAIL = `qa-demo-expiration-${Date.now()}@otnl.com.br`;

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

async function createQaUser(admin) {
  const authResult = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: "QA Demo Expiration" },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(`Failed to create auth user: ${authResult.error?.message}`);
  }

  const user = authResult.data.user;
  const profileResult = await admin.from("users").upsert({
    id: user.id,
    email: EMAIL,
    name: "QA Demo Expiration",
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

async function main() {
  loadDotenvLocal();

  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let userId = null;

  try {
    userId = await createQaUser(admin);

    const now = Date.now();
    const expiredAt = new Date(now - 60 * 60 * 1000).toISOString();
    const futureAt = new Date(now + 60 * 60 * 1000).toISOString();

    const insertResult = await admin
      .from("demo_sessions")
      .insert([
        {
          user_id: userId,
          prospect_name: "QA Expiration Pending Past",
          status: "pending",
          expires_at: expiredAt,
        },
        {
          user_id: userId,
          prospect_name: "QA Expiration Pending Future",
          status: "pending",
          expires_at: futureAt,
        },
        {
          user_id: userId,
          prospect_name: "QA Expiration Captured Past",
          status: "captured",
          expires_at: expiredAt,
          signals_json: { qa: true },
          insights_json: { riskScore: 100, verdictCards: [] },
        },
      ])
      .select("id, prospect_name, status");

    if (insertResult.error || !insertResult.data) {
      throw new Error(`Failed to create demo sessions: ${insertResult.error?.message}`);
    }

    const idsByName = new Map(
      insertResult.data.map((session) => [session.prospect_name, session.id]),
    );

    const rpcResult = await admin.rpc("expire_demo_sessions");
    if (rpcResult.error) {
      throw new Error(`Failed to run expire_demo_sessions: ${rpcResult.error.message}`);
    }

    const reloadResult = await admin
      .from("demo_sessions")
      .select("id, prospect_name, status, expires_at")
      .eq("user_id", userId);

    if (reloadResult.error || !reloadResult.data) {
      throw new Error(`Failed to reload demo sessions: ${reloadResult.error?.message}`);
    }

    const sessions = new Map(
      reloadResult.data.map((session) => [session.id, session]),
    );
    const pendingPast = sessions.get(idsByName.get("QA Expiration Pending Past"));
    const pendingFuture = sessions.get(idsByName.get("QA Expiration Pending Future"));
    const capturedPast = sessions.get(idsByName.get("QA Expiration Captured Past"));

    assert(pendingPast?.status === "expired", "Expired pending session was not marked expired.");
    assert(pendingFuture?.status === "pending", "Future pending session changed unexpectedly.");
    assert(capturedPast?.status === "captured", "Captured expired session changed unexpectedly.");

    const result = {
      ok: true,
      expiredRowsReported: rpcResult.data,
      checks: {
        pendingPast: pendingPast.status,
        pendingFuture: pendingFuture.status,
        capturedPast: capturedPast.status,
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
