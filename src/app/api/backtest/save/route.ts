import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

export async function POST(req: NextRequest) {
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

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const prospectName = formData.get("prospect_name") as string;
  const metricsRaw = formData.get("metrics") as string;
  const insightsRaw = formData.get("insights") as string | null;

  if (!file || !prospectName || !metricsRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let metrics: BacktestMetrics;
  let insights: AiInsights | null = null;

  try {
    metrics = JSON.parse(metricsRaw) as BacktestMetrics;
    if (insightsRaw) insights = JSON.parse(insightsRaw) as AiInsights;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Insert backtest record
  const { data: backtest, error: insertError } = await supabase
    .from("backtests")
    .insert({
      user_id: user.id,
      prospect_name: prospectName,
      filename: file.name,
      row_count: metrics.totalRows,
      fraud_count: metrics.confusionMatrix?.tp ?? null,
      metrics_json: metrics,
      ai_insights_json: insights,
    })
    .select("id")
    .single();

  if (insertError || !backtest) {
    console.error("Backtest insert error:", insertError);
    return NextResponse.json({ error: "Failed to save backtest" }, { status: 500 });
  }

  // Upload CSV to Supabase Storage
  const storagePath = `${user.id}/${backtest.id}/${file.name}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("backtest-files")
    .upload(storagePath, fileBuffer, {
      contentType: "text/csv",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    // Non-fatal: backtest is saved, only file upload failed
  } else {
    // Record file reference
    await supabase.from("backtest_files").insert({
      backtest_id: backtest.id,
      storage_path: storagePath,
    });
  }

  return NextResponse.json({ id: backtest.id });
}
