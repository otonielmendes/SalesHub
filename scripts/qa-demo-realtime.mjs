import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const APP_ORIGIN = process.env.QA_APP_ORIGIN || "http://localhost:3000";
const PREVIEW_ACCESS_URL = process.env.QA_PREVIEW_ACCESS_URL || process.env.QA_VERCEL_SHARE_URL || "";
const PASSWORD = `Qa-demo-${Date.now()}!`;
const EMAIL = `qa-demo-${Date.now()}@otnl.com.br`;

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

async function createQaUser(admin) {
  const authResult = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: "QA Demo Realtime" },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(`Failed to create auth user: ${authResult.error?.message}`);
  }

  const user = authResult.data.user;
  const profileResult = await admin.from("users").upsert({
    id: user.id,
    email: EMAIL,
    name: "QA Demo Realtime",
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

async function login(page) {
  if (PREVIEW_ACCESS_URL) {
    await page.goto(PREVIEW_ACCESS_URL, { waitUntil: "networkidle" });
  }
  await page.goto(`${APP_ORIGIN}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL(/\/backtests\/(historico|testagens)/, { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

async function createSessionFromUi(page) {
  await page.goto(`${APP_ORIGIN}/demos/device-fingerprinting/nova`, { waitUntil: "networkidle" });
  await page.fill("#prospect", "QA Realtime Codex");
  await page.fill("#whatsappPhone", "+55 11 99999-9999");
  await page.getByRole("button", { name: /Gerar link|Generate link|Generar enlace/i }).click();
  await page.waitForSelector("text=/Compartilhe a demo|Link gerado|Share the demo|Comparte la demo/", { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const bodyText = await page.locator("body").innerText();
  const token = bodyText.match(/\/demo\/([0-9a-f-]{36})/i)?.[1];
  if (!token) {
    throw new Error("Could not find generated share token in page body.");
  }
  return token;
}

async function main() {
  loadDotenvLocal();

  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  let userId = null;
  let browser = null;

  try {
    userId = await createQaUser(admin);
    browser = await chromium.launch({ headless: true });

    const seller = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const customer = await browser.newPage({ viewport: { width: 390, height: 844 } });

    const consoleErrors = new Set();
    const requestFailures = new Set();
    const recordConsoleError = (scope, text) => {
      const firstLine = text.split("\n")[0] || text;
      consoleErrors.add(`[${scope}] ${firstLine}`);
    };
    const recordRequestFailure = (scope, request) => {
      const failure = request.failure();
      requestFailures.add(`[${scope}] ${request.method()} ${request.url()} :: ${failure?.errorText ?? "unknown"}`);
    };
    seller.on("console", (msg) => {
      if (msg.type() === "error") recordConsoleError("seller", msg.text());
    });
    customer.on("console", (msg) => {
      if (msg.type() === "error") recordConsoleError("customer", msg.text());
    });
    seller.on("requestfailed", (request) => recordRequestFailure("seller", request));
    customer.on("requestfailed", (request) => recordRequestFailure("customer", request));

    await login(seller);
    const token = await createSessionFromUi(seller);

    const sessionResult = await admin
      .from("demo_sessions")
      .select("id")
      .eq("share_token", token)
      .single();

    if (sessionResult.error || !sessionResult.data) {
      throw new Error(`Could not find created session: ${sessionResult.error?.message}`);
    }

    const sessionId = sessionResult.data.id;
    await seller.goto(`${APP_ORIGIN}/demos/device-fingerprinting/${sessionId}`, {
      waitUntil: "networkidle",
    });
    await seller.waitForSelector("text=Aguardando o cliente", { timeout: 20_000 });

    await customer.goto(`${APP_ORIGIN}/demo/${token}`, { waitUntil: "networkidle" });
    await customer.waitForSelector("text=/Análise concluída|Dados já registados/", {
      timeout: 30_000,
    });

    await seller.waitForSelector("text=Capturado", { timeout: 30_000 });
    await seller.waitForSelector("text=INSIGHTS", { timeout: 30_000 });

    const dbResult = await admin
      .from("demo_sessions")
      .select("status, signals_json, insights_json")
      .eq("id", sessionId)
      .single();

    if (dbResult.error) {
      throw new Error(`Could not reload captured session: ${dbResult.error.message}`);
    }

    const insights = dbResult.data.insights_json;
    const result = {
      ok: true,
      sessionId,
      token,
      realtimeUpdatedSeller: true,
      dbStatus: dbResult.data.status,
      hasSignals: Boolean(dbResult.data.signals_json),
      hasInsights: Boolean(insights),
      verdictCardsCount: Array.isArray(insights?.verdictCards)
        ? insights.verdictCards.length
        : 0,
      riskScore: insights?.riskScore,
      riskLevel: insights?.riskLevel,
      consoleErrors: Array.from(consoleErrors),
      requestFailures: Array.from(requestFailures),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (browser) await browser.close();
    if (userId) await cleanupQaUser(admin, userId);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
