import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "@/lib/gemini/insights";
import type { BacktestMetrics } from "@/types/backtest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { metrics: BacktestMetrics };

    if (!body.metrics) {
      return NextResponse.json({ error: "metrics required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 503 },
      );
    }

    const insights = await generateInsights(body.metrics);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Gemini insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
