import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const APP_ORIGIN = process.env.QA_APP_ORIGIN || "http://localhost:3000";
const PREVIEW_ACCESS_URL = process.env.QA_PREVIEW_ACCESS_URL || process.env.QA_VERCEL_SHARE_URL || "";
const PASSWORD = `Qa-demo-share-${Date.now()}!`;
const EMAIL = `qa-demo-share-${Date.now()}@otnl.com.br`;

const generateButtonName = /Gerar link|Generate link|Generar enlace/i;
const generatedText = /Link gerado|Enlace generado|Link generated/i;
const demoLinkPattern = /\/demo\/([0-9a-f-]{36})/i;

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
    user_metadata: { name: "QA Demo Share Channels" },
  });

  if (authResult.error || !authResult.data.user) {
    throw new Error(`Failed to create auth user: ${authResult.error?.message}`);
  }

  const user = authResult.data.user;
  const profileResult = await admin.from("users").upsert({
    id: user.id,
    email: EMAIL,
    name: "QA Demo Share Channels",
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
}

async function gotoNewAnalysis(page, name) {
  await page.goto(`${APP_ORIGIN}/demos/device-fingerprinting/nova`, { waitUntil: "networkidle" });
  await page.fill("#prospect", name);
}

async function generate(page) {
  await page.getByRole("button", { name: generateButtonName }).click();
  await page.getByText(generatedText).first().waitFor({ timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);

  const bodyText = await page.locator("body").innerText();
  const token = bodyText.match(demoLinkPattern)?.[1];
  assert(token, "Could not find generated /demo/[token] link in page body.");

  return {
    token,
    url: `${APP_ORIGIN}/demo/${token}`,
  };
}

async function assertSessionExists(admin, token) {
  const result = await admin
    .from("demo_sessions")
    .select("id, status, share_token")
    .eq("share_token", token)
    .single();

  if (result.error || !result.data) {
    throw new Error(`Generated token was not persisted: ${result.error?.message}`);
  }
  assert(result.data.status === "pending", `Generated session status is ${result.data.status}, expected pending.`);
}

async function closeModal(page) {
  await page.getByRole("button", { name: /Fechar|Close|Cerrar/i }).click();
  await page.waitForTimeout(200);
}

async function testWhatsApp(page, admin) {
  await gotoNewAnalysis(page, "QA Share WhatsApp");
  await page.fill("#whatsappPhone", "+55 11 99999-9999");

  const { token, url } = await generate(page);
  await assertSessionExists(admin, token);

  await page.getByText(/Enviar por WhatsApp|Send by WhatsApp/i).waitFor({ timeout: 10_000 });
  const whatsappHref = await page.getByRole("link", { name: /WhatsApp/i }).getAttribute("href");
  assert(whatsappHref?.startsWith("https://wa.me/5511999999999?"), "WhatsApp href does not include normalized recipient phone.");
  assert(whatsappHref.includes(encodeURIComponent(url)), "WhatsApp href does not include generated demo link.");

  await closeModal(page);
  await page.getByRole("button", { name: /^Email$/i }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: /^QR$/i }).waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: /Copiar|Copy/i }).first().waitFor({ timeout: 10_000 });

  return true;
}

async function testEmail(page, admin) {
  await gotoNewAnalysis(page, "QA Share Email");
  await page.getByRole("button", { name: /Email/i }).first().click();
  await page.fill("#emailTo", "cliente.qa@example.com");

  const { token, url } = await generate(page);
  await assertSessionExists(admin, token);

  await page.getByText(/Enviar por email|Send by email|Enviar por email/i).waitFor({ timeout: 10_000 });
  const gmailHref = await page.getByRole("link", { name: /Gmail/i }).getAttribute("href");
  assert(gmailHref?.startsWith("https://mail.google.com/mail/?"), "Gmail href is missing.");
  assert(gmailHref.includes("to=cliente.qa%40example.com"), "Gmail href does not include recipient email.");
  assert(gmailHref.includes(encodeURIComponent(url)), "Gmail href does not include generated demo link.");

  return true;
}

async function testQr(page, admin) {
  await gotoNewAnalysis(page, "QA Share QR");
  await page.getByRole("button", { name: /QR Code/i }).click();

  const { token } = await generate(page);
  await assertSessionExists(admin, token);

  await page.getByRole("heading", { name: /QR Code/i }).waitFor({ timeout: 10_000 });
  const qr = page.getByRole("img", { name: /QR Code|QR/i });
  await qr.waitFor({ timeout: 10_000 });
  const qrSrc = await qr.getAttribute("src");
  assert(qrSrc?.startsWith("data:image/png;base64,"), "QR image was not rendered as a data URL.");

  return true;
}

async function testCopy(page, admin) {
  await gotoNewAnalysis(page, "QA Share Copy");
  await page.getByRole("button", { name: /Copiar enlace|Copiar link|Copy link/i }).first().click();

  const { token, url } = await generate(page);
  await assertSessionExists(admin, token);

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  assert(clipboardText === url, "Copy channel did not write the generated link to the clipboard.");

  return true;
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
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: APP_ORIGIN });

    const page = await context.newPage();
    const consoleErrors = new Set();
    const requestFailures = new Set();

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.add(msg.text().split("\n")[0] || msg.text());
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      requestFailures.add(`${request.method()} ${request.url()} :: ${failure?.errorText ?? "unknown"}`);
    });

    await login(page);

    const checks = {
      whatsapp: await testWhatsApp(page, admin),
      email: await testEmail(page, admin),
      qr: await testQr(page, admin),
      copy: await testCopy(page, admin),
    };

    const result = {
      ok: true,
      checks,
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
