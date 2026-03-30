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
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 503 },
      );
    }

    const insights = await generateInsights(body.metrics);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Gemini insights error:", error);

    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("429")) {
      return NextResponse.json(
        { error: "Limite de requisições do Gemini atingido. Aguarde alguns minutos e tente novamente, ou ative o faturamento em aistudio.google.com." },
        { status: 429 },
      );
    }

    if (msg.includes("401") || msg.includes("403")) {
      return NextResponse.json(
        { error: "Chave de API do Gemini inválida ou sem permissão." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao gerar insights. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
