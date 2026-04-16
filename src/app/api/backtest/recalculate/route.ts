import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseCsv } from "@/lib/csv/parser";
import { calculateMetrics } from "@/lib/csv/metrics";

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: string;
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) throw new Error("missing id");
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify the backtest belongs to the authenticated user
  const { data: backtest, error: fetchError } = await supabase
    .from("backtests")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !backtest) {
    return NextResponse.json({ error: "Backtest not found" }, { status: 404 });
  }

  // Look up the storage path from backtest_files
  const { data: fileRecord, error: fileError } = await supabase
    .from("backtest_files")
    .select("storage_path")
    .eq("backtest_id", id)
    .maybeSingle();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  if (!fileRecord?.storage_path) {
    return NextResponse.json(
      { error: "No CSV file found for this backtest. Please re-upload it from New analysis." },
      { status: 404 },
    );
  }

  // Download the CSV from Supabase Storage
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("backtest-files")
    .download(fileRecord.storage_path);

  if (downloadError || !fileBlob) {
    console.error("Storage download error:", downloadError);
    return NextResponse.json(
      { error: "Failed to download CSV from storage" },
      { status: 500 },
    );
  }

  const csvText = await fileBlob.text();

  // Re-parse and re-calculate with the corrected pipeline
  const { rows, currency } = parseCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV is empty or invalid" }, { status: 422 });
  }

  const metrics = calculateMetrics(rows, currency);

  // Update the backtest record with the fresh metrics
  const { error: updateError } = await supabase
    .from("backtests")
    .update({
      metrics_json: metrics,
      row_count: metrics.totalRows,
      fraud_count: metrics.confusionMatrix?.tp ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Backtest update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
