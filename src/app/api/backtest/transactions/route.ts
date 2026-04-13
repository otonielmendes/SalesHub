import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseCsv } from "@/lib/csv/parser";
import type { BacktestTransactionRecord } from "@/types/backtest";

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
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

function toTransactionRecord(index: number, row: ReturnType<typeof parseCsv>["rows"][number]): BacktestTransactionRecord {
  return {
    id: `${index + 1}`,
    orderId: row.orderId,
    date: row.date,
    amount: row.amount,
    paymentStatus: row.paymentStatus,
    fraud: row.fraud,
    koinDecision: row.koinDecision,
    item: row.item,
    cardBrand: row.cardBrand,
    document: row.document,
    email: row.email,
    phone: row.phone,
    bin: row.bin,
    delivery: row.delivery,
  };
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

  const { data: backtest, error: fetchError } = await supabase
    .from("backtests")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !backtest) {
    return NextResponse.json({ error: "Backtest not found" }, { status: 404 });
  }

  const { data: fileRecord, error: fileError } = await supabase
    .from("backtest_files")
    .select("storage_path")
    .eq("backtest_id", id)
    .maybeSingle();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  if (!fileRecord?.storage_path) {
    return NextResponse.json({ error: "No CSV file found for this backtest." }, { status: 404 });
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("backtest-files")
    .download(fileRecord.storage_path);

  if (downloadError || !fileBlob) {
    return NextResponse.json({ error: "Failed to download CSV from storage." }, { status: 500 });
  }

  const csvText = await fileBlob.text();
  const { rows, currency, headers, colMap } = parseCsv(csvText);

  return NextResponse.json({
    currency,
    headers,
    detectedColumns: colMap,
    rows: rows.map((row, index) => toTransactionRecord(index, row)),
  });
}
