import { NextRequest, NextResponse, after } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeEmail } from "@/lib/auth/email";
import { notifySlackPendingSignup } from "@/lib/notify/slack-signup";

const ALLOWED_DOMAINS = ["koin.com.br", "otnl.com.br"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get("name") as string;
  const rawEmail = formData.get("email") as string;
  const password = formData.get("password") as string;
  const email = rawEmail ? normalizeEmail(rawEmail) : "";

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/signup?error=missing_fields", req.url));
  }

  const domain = email.split("@")[1];
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return NextResponse.redirect(new URL("/signup?error=invalid_domain", req.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    const msg = error?.message?.includes("already") ? "email_exists" : "signup_error";
    return NextResponse.redirect(new URL(`/signup?error=${msg}`, req.url));
  }

  const bootstrapEmail = process.env.SALES_HUB_BOOTSTRAP_ADMIN_EMAIL
    ? normalizeEmail(process.env.SALES_HUB_BOOTSTRAP_ADMIN_EMAIL)
    : null;
  const isBootstrapAdmin = bootstrapEmail !== null && email === bootstrapEmail;

  // Insert into public.users — sempre pending; bootstrap promove via service role a seguir
  const { error: insertError } = await supabase.from("users").insert({
    id: data.user.id,
    email,
    name,
    role: "user",
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("[signup] users insert failed:", insertError.message);
  }

  if (!insertError && !isBootstrapAdmin) {
    const adminUsersUrl = new URL("/admin/users", req.url).href;
    after(() =>
      void notifySlackPendingSignup({
        webhookUrl: process.env.SALES_HUB_SLACK_SIGNUP_WEBHOOK_URL,
        name,
        email,
        adminUsersUrl,
      }),
    );
  }

  if (isBootstrapAdmin && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await admin
      .from("users")
      .update({ role: "admin", status: "active" })
      .eq("id", data.user.id);
  }

  await supabase.auth.signOut();

  const loginMessage = isBootstrapAdmin ? "bootstrap_admin" : "pending_approval";
  return NextResponse.redirect(new URL(`/login?message=${loginMessage}`, req.url));
}
