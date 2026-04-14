import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseCsv } from "@/lib/csv/parser";
import type { BacktestTransactionRecord } from "@/types/backtest";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

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

function matchesTerm(row: BacktestTransactionRecord, term: string) {
  if (!term) return true;

  return [
    row.orderId,
    row.date,
    row.paymentStatus,
    row.koinDecision,
    row.item,
    row.cardBrand,
    row.document,
    row.email,
    row.phone,
    row.bin,
    row.delivery,
    row.amount != null ? String(row.amount) : null,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

function isKoinReject(decision: string | null) {
  return ["reject", "rechaz", "recus", "negad"].some((token) => decision?.toLowerCase().includes(token));
}

function isApproved(status: string | null) {
  return ["approv", "aprov", "paid", "acredit"].some((token) => status?.toLowerCase().includes(token));
}

function matchesFilter(row: BacktestTransactionRecord, filter: string) {
  return (
    filter === "all" ||
    (filter === "fraud" && row.fraud === true) ||
    (filter === "clean" && row.fraud === false) ||
    (filter === "koin-reject" && isKoinReject(row.koinDecision)) ||
    (filter === "approved" && isApproved(row.paymentStatus))
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
  let page = 1;
  let pageSize = DEFAULT_PAGE_SIZE;
  let search = "";
  let filter = "all";
  try {
    const body = (await req.json()) as {
      id?: string;
      page?: number;
      pageSize?: number;
      search?: string;
      filter?: string;
    };
    if (!body.id) throw new Error("missing id");
    id = body.id;
    page = Math.max(1, Number(body.page) || 1);
    pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(body.pageSize) || DEFAULT_PAGE_SIZE));
    search = (body.search ?? "").trim().toLowerCase();
    filter = body.filter ?? "all";
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
  const allRows = rows.map((row, index) => toTransactionRecord(index, row));
  const filteredRows = allRows.filter((row) => matchesTerm(row, search) && matchesFilter(row, filter));
  const totalFiltered = filteredRows.length;
  const totalRows = allRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);

  return NextResponse.json({
    currency,
    headers,
    detectedColumns: colMap,
    page: safePage,
    pageSize,
    totalRows,
    totalFiltered,
    totalPages,
    rows: pageRows,
  });
}
