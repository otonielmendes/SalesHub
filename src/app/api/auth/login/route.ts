import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { normalizeEmail } from "@/lib/auth/email";

function loginErrorRedirect(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, req.url), { status: 303 });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const rawEmail = formData.get("email") as string;
  const password = formData.get("password") as string;
  const email = rawEmail ? normalizeEmail(rawEmail) : "";

  if (!email || !password) {
    return loginErrorRedirect(req, "missing_fields");
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const msg = (error?.message ?? "").toLowerCase();
    if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
      return loginErrorRedirect(req, "email_not_confirmed");
    }
    if (msg.includes("too many requests") || msg.includes("rate limit")) {
      return loginErrorRedirect(req, "rate_limited");
    }
    return loginErrorRedirect(req, "invalid_credentials");
  }

  // Após signIn, o JWT pode ainda não ir no mesmo request à query com RLS → 0 linhas → falso "pending".
  // Ler perfil com service role só depois de password válido (servidor apenas).
  const userId = data.user.id;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  let status: string | undefined;
  if (serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: row } = await admin
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();
    status = row?.status;
    if (status && status !== "pending" && status !== "disabled") {
      await admin
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);
    }
  } else {
    const { data: userProfile } = await supabase
      .from("users")
      .select("status")
      .eq("id", userId)
      .single();
    status = userProfile?.status;
    if (status && status !== "pending" && status !== "disabled") {
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);
    }
  }

  if (!status || status === "pending") {
    await supabase.auth.signOut();
    return loginErrorRedirect(req, "pending_approval");
  }

  if (status === "disabled") {
    await supabase.auth.signOut();
    return loginErrorRedirect(req, "account_disabled");
  }

  return NextResponse.redirect(new URL("/backtests/historico", req.url), { status: 303 });
}
