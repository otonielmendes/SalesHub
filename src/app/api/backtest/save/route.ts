import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

type SavePayload = {
  prospect_name: string;
  filename: string;
  metrics: BacktestMetrics;
  insights?: AiInsights | null;
};

type PatchPayload = {
  id: string;
  insights: AiInsights;
};

async function buildSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(req: NextRequest) {
  const supabase = await buildSupabaseClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse JSON body (avoids multipart body-size limits on Vercel)
  let payload: SavePayload;
  try {
    payload = (await req.json()) as SavePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prospect_name, filename, metrics, insights } = payload;

  if (!prospect_name || !filename || !metrics) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Insert backtest record
  const { data: backtest, error: insertError } = await supabase
    .from("backtests")
    .insert({
      user_id: user.id,
      prospect_name,
      filename,
      row_count: metrics.totalRows,
      fraud_count: metrics.confusionMatrix?.tp ?? null,
      metrics_json: metrics,
      ai_insights_json: insights ?? null,
    })
    .select("id")
    .single();

  if (insertError || !backtest) {
    console.error("Backtest insert error:", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save backtest" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: backtest.id });
}

export async function PATCH(req: NextRequest) {
  const supabase = await buildSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PatchPayload;
  try {
    payload = (await req.json()) as PatchPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, insights } = payload;
  if (!id || !insights) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("backtests")
    .update({ ai_insights_json: insights })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Backtest patch error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await buildSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("backtests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Backtest delete error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
