import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/email";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const raw = formData.get("email") as string;
  const email = raw ? normalizeEmail(raw) : "";

  if (!email) {
    return NextResponse.redirect(new URL("/recuperar-senha?error=missing_email", req.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/recuperar-senha?error=config", req.url));
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const redirectTo = `${req.nextUrl.origin}/auth/atualizar-senha`;
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return NextResponse.redirect(new URL("/recuperar-senha?message=sent", req.url));
}
