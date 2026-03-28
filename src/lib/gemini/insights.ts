import type { AiInsights, BacktestMetrics, RiskEntry } from "@/types/backtest";

interface GeminiSummary {
  columns: string[];
  metrics: Partial<BacktestMetrics>;
  topItems: RiskEntry[];
  topBins: RiskEntry[];
  topEmails: RiskEntry[];
  topDocuments: RiskEntry[];
}

function buildSummary(metrics: BacktestMetrics): GeminiSummary {
  return {
    columns: Object.keys(metrics).filter((k) => metrics[k as keyof BacktestMetrics] !== null),
    metrics: {
      totalRows: metrics.totalRows,
      approvalRateToday: metrics.approvalRateToday,
      approvalRateKoin: metrics.approvalRateKoin,
      fraudRateApprovedToday: metrics.fraudRateApprovedToday,
      fraudRateApprovedKoin: metrics.fraudRateApprovedKoin,
      confusionMatrix: metrics.confusionMatrix,
      preventedPct: metrics.preventedPct,
      recoverableTransactions: metrics.recoverableTransactions,
      recoverableVolume: metrics.recoverableVolume,
      valueImpactRatio: metrics.valueImpactRatio,
      protectedValue: metrics.protectedValue,
      totalGmv: metrics.totalGmv,
    },
    topItems: (metrics.riskByItem ?? []).slice(0, 10),
    topBins: (metrics.riskByBin ?? []).slice(0, 10),
    topEmails: (metrics.riskByEmailDomain ?? []).slice(0, 10),
    topDocuments: (metrics.riskByDocument ?? []).slice(0, 10),
  };
}

const GEMINI_MODEL = "gemini-2.0-flash";

export async function generateInsights(metrics: BacktestMetrics): Promise<AiInsights> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const summary = buildSummary(metrics);

  const prompt = `
Você é um especialista em antifraude da Koin. Analise o seguinte resumo de backtest e gere insights.

Resumo estatístico:
${JSON.stringify(summary, null, 2)}

Gere entre 3 e 6 insights com a seguinte estrutura JSON:
{
  "insights": [
    {
      "severity": "critical" | "moderate" | "informative",
      "title": "Título curto (máx 10 palavras)",
      "description": "Descrição concisa (máx 3 frases)"
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional.
  `.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text.trim()) {
    throw new Error("Resposta vazia do Gemini");
  }

  const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  let parsed: { insights: AiInsights["insights"] };
  try {
    parsed = JSON.parse(cleaned) as { insights: AiInsights["insights"] };
  } catch {
    throw new Error("JSON inválido na resposta do Gemini");
  }

  return {
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    generatedAt: new Date().toISOString(),
  };
}
