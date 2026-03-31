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

const DEFAULT_GEMINI_MODELS = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
].filter((model): model is string => Boolean(model));

function extractJsonCandidate(text: string): string {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  if (!cleaned) return cleaned;

  const firstObjectStart = cleaned.indexOf("{");
  const lastObjectEnd = cleaned.lastIndexOf("}");
  if (firstObjectStart !== -1 && lastObjectEnd !== -1 && lastObjectEnd > firstObjectStart) {
    return cleaned.slice(firstObjectStart, lastObjectEnd + 1).trim();
  }

  const firstArrayStart = cleaned.indexOf("[");
  const lastArrayEnd = cleaned.lastIndexOf("]");
  if (firstArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > firstArrayStart) {
    return cleaned.slice(firstArrayStart, lastArrayEnd + 1).trim();
  }

  return cleaned;
}

function normalizeInsightsPayload(payload: unknown): AiInsights["insights"] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is AiInsights["insights"][number] => {
      return typeof item === "object" && item !== null && "title" in item && "description" in item;
    });
  }

  if (typeof payload === "object" && payload !== null && "insights" in payload) {
    const insights = (payload as { insights?: unknown }).insights;
    return Array.isArray(insights)
      ? insights.filter((item): item is AiInsights["insights"][number] => {
          return typeof item === "object" && item !== null && "title" in item && "description" in item;
        })
      : [];
  }

  return [];
}

export async function generateInsights(metrics: BacktestMetrics): Promise<AiInsights> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const summary = buildSummary(metrics);

  const prompt = `
Você é um especialista em antifraude da Koin. Analise os dados agregados extraídos do CSV/tabela de backtest enviado e gere insights acionáveis.

Resumo estatístico:
${JSON.stringify(summary, null, 2)}

Gere entre 3 e 6 insights com a seguinte estrutura JSON:
{
  "insights": [
    {
      "severity": "critical" | "moderate" | "informative",
      "category": "BIN" | "Identidade" | "Categoria" | "Conversão" | "Operação" | "Email",
      "title": "Título curto (máx 10 palavras)",
      "description": "Descrição concisa (máx 3 frases) com recomendação acionável",
      "detected": 132,
      "total": 175
    }
  ]
}

Regras:
- "category": escolha a mais relevante para o insight (BIN se menciona BINs, Identidade se menciona documentos/CPF, Categoria se menciona produtos, Conversão se menciona aprovação/revenue recovery, Operação se menciona regras/calibração, Email se menciona emails)
- "detected" e "total": preencha APENAS quando o insight cita casos contáveis (ex: "132 de 175 fraudes detectadas" → detected: 132, total: 175). Omita os campos se não houver contagem clara.
- Priorize insights com impacto financeiro mensurável e recomendações concretas.
- Se não houver material suficiente para 3 insights fortes, devolva apenas os insights realmente sustentados pelos dados.

Responda APENAS com o JSON, sem texto adicional.
  `.trim();

  let lastError: Error | null = null;

  for (const model of DEFAULT_GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      const error = new Error(`Gemini API ${response.status}: ${errText.slice(0, 400)}`);

      if (response.status === 404) {
        lastError = error;
        continue;
      }

      throw error;
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

    const candidate = extractJsonCandidate(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate) as unknown;
    } catch {
      throw new Error("JSON inválido na resposta do Gemini");
    }

    const normalizedInsights = normalizeInsightsPayload(parsed);
    if (normalizedInsights.length === 0) {
      throw new Error("Resposta do Gemini sem insights válidos");
    }

    return {
      insights: normalizedInsights,
      generatedAt: new Date().toISOString(),
    };
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Nenhum modelo Gemini compatível disponível");
}
