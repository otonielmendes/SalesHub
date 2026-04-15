import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  DeviceSignals,
  DeviceInsights,
  VerdictCard,
  EvidenceItem,
  EvidenceStatus,
  VerdictStatus,
  RequestGeoSignals,
} from "@/types/demos";

function buildServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ev(label: string, value: string, status: EvidenceStatus): EvidenceItem {
  return { label, value, status };
}

function headerValue(req: NextRequest, name: string): string | null {
  const value = req.headers.get(name);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRequestGeo(req: NextRequest): RequestGeoSignals | null {
  const country = headerValue(req, "x-vercel-ip-country");
  const region = headerValue(req, "x-vercel-ip-country-region");
  const city = headerValue(req, "x-vercel-ip-city");
  const latitude = headerValue(req, "x-vercel-ip-latitude");
  const longitude = headerValue(req, "x-vercel-ip-longitude");
  const timezone = headerValue(req, "x-vercel-ip-timezone");

  if (!country && !region && !city && !timezone) return null;

  return {
    country,
    region,
    city,
    latitude,
    longitude,
    timezone,
    source: "vercel",
    precision: "country_region_city_estimate",
  };
}

function verdict(gained: number, max: number): VerdictStatus {
  const ratio = gained / max;
  if (ratio >= 0.8) return "confirmed";
  if (ratio >= 0.4) return "alert";
  return "inconclusive";
}

/** Heurística básica: lang region vs timezone offset */
function timezoneMatchesLang(lang: string, tzOffset: number): boolean {
  const lower = lang.toLowerCase();
  // Europa Ocidental: UTC0 a UTC+2
  if (lower.startsWith("en-gb") || lower.startsWith("fr") || lower.startsWith("de") || lower.startsWith("es-es")) {
    return tzOffset >= 0 && tzOffset <= 2;
  }
  // América Latina / Brasil: UTC-5 a UTC-2
  if (lower.startsWith("pt") || lower.includes("419") || lower.startsWith("es")) {
    return tzOffset >= -5 && tzOffset <= -2;
  }
  // EUA / Canadá: UTC-8 a UTC-4
  if (lower === "en" || lower.startsWith("en-us") || lower.startsWith("en-ca")) {
    return tzOffset >= -8 && tzOffset <= -4;
  }
  // Ásia/Pacífico: UTC+5 a UTC+13
  if (lower.startsWith("zh") || lower.startsWith("ja") || lower.startsWith("ko")) {
    return tzOffset >= 5 && tzOffset <= 13;
  }
  return true; // sem regra → não penaliza
}

function localeCountry(lang: string): string | null {
  const [, country] = lang.match(/^[a-z]{2,3}[-_]([a-z]{2})/i) ?? [];
  return country ? country.toUpperCase() : null;
}

function countryMatchesLocale(lang: string, country: string | null | undefined): boolean {
  const expected = localeCountry(lang);
  if (!expected || !country) return true;
  return expected === country.toUpperCase();
}

function formatEstimatedGeo(geo: RequestGeoSignals | null | undefined): string {
  if (!geo) return "indisponível";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "indisponível";
}

function uaIsHeadless(ua: string): boolean {
  return /headlesschrome|phantomjs|electron|wv\b/i.test(ua);
}

// ─── Insight generator ────────────────────────────────────────────────────────

function generateInsights(signals: DeviceSignals): DeviceInsights {
  const s = signals.session;

  // ── 1. FINGERPRINT ÚNICO (28 pts) ─────────────────────────────────────────
  // canvasId presente → hash único de rendering (+18)
  // GPU vendor+name presentes → hardware real confirmado (+10)
  const hasCanvas = !!s.canvasId;
  const hasGpu = !!(s.gpuVendor || s.gpuName);

  const fp_canvas = hasCanvas ? 18 : 0;
  const fp_gpu = hasGpu ? 10 : 0;
  const fp_gained = fp_canvas + fp_gpu;
  const fp_max = 28;

  const fpEvidence: EvidenceItem[] = [
    ev("Canvas hash", hasCanvas ? s.canvasId!.slice(0, 16) + "…" : "indisponível", hasCanvas ? "ok" : "alert"),
    ev("GPU vendor", s.gpuVendor ?? "indisponível", s.gpuVendor ? "ok" : "alert"),
    ev("GPU renderer", s.gpuName ?? "indisponível", s.gpuName ? "ok" : "alert"),
  ];

  const fpCard: VerdictCard = {
    id: "fingerprint",
    title: "FINGERPRINT ÚNICO",
    verdict: verdict(fp_gained, fp_max),
    verdictLabel: verdict(fp_gained, fp_max) === "confirmed" ? "Confirmado" : verdict(fp_gained, fp_max) === "alert" ? "Atenção" : "Inconclusivo",
    explanation: hasCanvas && hasGpu
      ? "O canvas hash e o GPU renderer identificam este dispositivo de forma única e persistente. Difícil de falsificar sem hardware real."
      : !hasCanvas && !hasGpu
      ? "Canvas e WebGL estão bloqueados. Pode indicar extensão anti-fingerprinting ou browser headless."
      : !hasCanvas
      ? "Canvas bloqueado — possível extensão de privacidade activa. GPU confirmado."
      : "GPU indisponível — WebGL bloqueado ou ausente. Canvas hash confirmado.",
    scoreGained: fp_gained,
    scoreMax: fp_max,
    evidence: fpEvidence,
  };

  // ── 2. HARDWARE COERENTE (25 pts) ─────────────────────────────────────────
  // cores > 2 (+8) · deviceMemory > 2 (+7) · GPU+OS consistentes (+10)
  const hasCores = s.cores != null && s.cores > 2;
  const hasMemory = s.deviceMemory != null && s.deviceMemory > 2;
  // Coerência GPU+OS: se gpuVendor "Apple" mas platform não MacIntel → suspeito
  const gpuOsCoherent = !s.gpuVendor
    ? true // sem GPU não penaliza aqui (já penalizou em fingerprint)
    : (s.gpuVendor.toLowerCase().includes("apple") && s.platform.toLowerCase().includes("mac")) ||
      (s.gpuVendor.toLowerCase().includes("intel") || s.gpuVendor.toLowerCase().includes("nvidia") || s.gpuVendor.toLowerCase().includes("amd"));

  const hw_cores = hasCores ? 8 : (s.cores != null ? 4 : 0);
  const hw_mem = hasMemory ? 7 : (s.deviceMemory != null ? 3 : 0);
  const hw_coherent = gpuOsCoherent ? 10 : 3;
  const hw_gained = hw_cores + hw_mem + hw_coherent;
  const hw_max = 25;

  const hwEvidence: EvidenceItem[] = [
    ev("CPU cores", s.cores != null ? String(s.cores) : "indisponível", hasCores ? "ok" : s.cores != null ? "alert" : "neutral"),
    ev("Memória RAM", s.deviceMemory != null ? `${s.deviceMemory} GB` : "indisponível", hasMemory ? "ok" : s.deviceMemory != null ? "alert" : "neutral"),
    ev("Pixel ratio", String(s.devicePixelRatio), s.devicePixelRatio > 1 ? "ok" : "alert"),
    ev("GPU+OS coerência", gpuOsCoherent ? "Consistente" : "Inconsistente", gpuOsCoherent ? "ok" : "alert"),
    ev("Velocidade CPU", s.cpuSpeed.average != null ? `${s.cpuSpeed.average.toFixed(1)} ops/ms` : "indisponível", s.cpuSpeed.average != null ? "ok" : "neutral"),
  ];

  const hwCard: VerdictCard = {
    id: "hardware",
    title: "HARDWARE COERENTE",
    verdict: verdict(hw_gained, hw_max),
    verdictLabel: verdict(hw_gained, hw_max) === "confirmed" ? "Confirmado" : verdict(hw_gained, hw_max) === "alert" ? "Atenção" : "Inconclusivo",
    explanation: hasCores && hasMemory && gpuOsCoherent
      ? "CPU, memória e GPU são consistentes entre si e com o sistema operativo declarado. Hardware real."
      : !hasCores && !hasMemory
      ? "Núcleos de CPU e memória indisponíveis — APIs bloqueadas ou browser headless sem configuração de hardware."
      : "Alguns sinais de hardware estão ausentes ou inconsistentes. Pode ser browser com privacidade reforçada.",
    scoreGained: hw_gained,
    scoreMax: hw_max,
    evidence: hwEvidence,
  };

  // ── 3. SESSÃO NORMAL (22 pts) ─────────────────────────────────────────────
  // privateBrowsing=false (+10) · storage completo (+8) · plugins > 0 (+4)
  const isNormalSession = s.privateBrowsing === false;
  const storageOk = s.localStorage && s.indexedDB && s.cookiesEnabled;
  const hasPlugins = s.plugins && s.plugins.trim().length > 0;

  const ss_priv = isNormalSession ? 10 : (s.privateBrowsing === null ? 5 : 0);
  const ss_storage = storageOk ? 8 : (s.localStorage || s.cookiesEnabled ? 4 : 0);
  const ss_plugins = hasPlugins ? 4 : 0;
  const ss_gained = ss_priv + ss_storage + ss_plugins;
  const ss_max = 22;

  const ssEvidence: EvidenceItem[] = [
    ev("Modo incógnito", s.privateBrowsing === false ? "Não" : s.privateBrowsing === true ? "Sim" : "Inconclusivo", s.privateBrowsing === false ? "ok" : s.privateBrowsing === true ? "alert" : "neutral"),
    ev("localStorage", s.localStorage ? "Disponível" : "Bloqueado", s.localStorage ? "ok" : "alert"),
    ev("indexedDB", s.indexedDB ? "Disponível" : "Bloqueado", s.indexedDB ? "ok" : "alert"),
    ev("Cookies", s.cookiesEnabled ? "Activos" : "Bloqueados", s.cookiesEnabled ? "ok" : "alert"),
    ev("Plugins", hasPlugins ? `${s.plugins.split(",").length} detectados` : "Nenhum", hasPlugins ? "ok" : "alert"),
  ];

  const ssCard: VerdictCard = {
    id: "session",
    title: "SESSÃO NORMAL",
    verdict: verdict(ss_gained, ss_max),
    verdictLabel: verdict(ss_gained, ss_max) === "confirmed" ? "Confirmado" : verdict(ss_gained, ss_max) === "alert" ? "Atenção" : "Inconclusivo",
    explanation: isNormalSession && storageOk && hasPlugins
      ? "Sessão em browser normal, não privada. Storage completo e plugins instalados confirmam ambiente de uso real."
      : s.privateBrowsing === true
      ? "Modo incógnito activo. Storage restrito — comportamento esperado para navegação privada."
      : "Alguns sinais de sessão normal estão ausentes. Possível modo privado ou restrições de browser.",
    scoreGained: ss_gained,
    scoreMax: ss_max,
    evidence: ssEvidence,
  };

  // ── 4. SEM ANTI-FINGERPRINTING (15 pts) ───────────────────────────────────
  // canvasId não-null (+8) · doNotTrack=false (+4) · WebGL activo (+3)
  const noAntiCanvas = hasCanvas;
  const noDnt = !s.doNotTrack;
  const hasWebgl = !!(s.gpuVendor || s.gpuName);
  const noHeadlessUa = !uaIsHeadless(s.userAgent);

  const af_canvas = noAntiCanvas ? 8 : 0;
  const af_dnt = noDnt ? 4 : 0;
  const af_webgl = hasWebgl ? 3 : 0;
  const af_gained = af_canvas + af_dnt + af_webgl;
  const af_max = 15;

  const afEvidence: EvidenceItem[] = [
    ev("Canvas API", noAntiCanvas ? "Activa" : "Bloqueada", noAntiCanvas ? "ok" : "alert"),
    ev("Do Not Track", s.doNotTrack ? "Activo" : "Inactivo", noDnt ? "ok" : "alert"),
    ev("WebGL", hasWebgl ? "Disponível" : "Bloqueado", hasWebgl ? "ok" : "alert"),
    ev("User-Agent", noHeadlessUa ? "Browser real" : "Padrão suspeito", noHeadlessUa ? "ok" : "alert"),
  ];

  const afCard: VerdictCard = {
    id: "antifingerprint",
    title: "SEM ANTI-FINGERPRINTING",
    verdict: verdict(af_gained, af_max),
    verdictLabel: verdict(af_gained, af_max) === "confirmed" ? "Confirmado" : verdict(af_gained, af_max) === "alert" ? "Atenção" : "Inconclusivo",
    explanation: noAntiCanvas && noDnt && hasWebgl
      ? "Nenhuma extensão de bloqueio de fingerprinting detectada. Canvas e WebGL acessíveis normalmente."
      : !noAntiCanvas && !hasWebgl
      ? "Canvas e WebGL bloqueados — forte indicador de extensão anti-rastreamento ou browser com privacidade máxima."
      : "Alguns sinais de privacidade activos. Pode ser preferência do utilizador sem intenção maliciosa.",
    scoreGained: af_gained,
    scoreMax: af_max,
    evidence: afEvidence,
  };

  // ── 5. CONTEXTO GEOGRÁFICO CONSISTENTE (10 pts) ───────────────────────────
  // Sinais geográficos são estimativos: idioma, fuso do browser e headers geo da request.
  const hasLang = !!s.lang;
  const requestGeo = signals.requestGeo ?? null;
  const hasRequestGeo = !!(requestGeo?.country || requestGeo?.region || requestGeo?.city);
  const tzConsistent = hasLang && timezoneMatchesLang(s.lang, s.timezone);
  const countryConsistent = countryMatchesLocale(s.lang, requestGeo?.country);
  const geoConsistent = tzConsistent && countryConsistent;

  const geo_context = hasLang || s.timezoneName || hasRequestGeo ? 5 : 0;
  const geo_consistency = geoConsistent ? 5 : 0;
  const geo_gained = geo_context + geo_consistency;
  const geo_max = 10;

  const utcLabel = `UTC${s.timezone >= 0 ? "+" : ""}${s.timezone}`;
  const browserTimezone = s.timezoneName ? `${utcLabel} · ${s.timezoneName}` : utcLabel;
  const geoPrecision = hasRequestGeo
    ? "País/região/cidade aproximados"
    : "Sem geo da request";

  const geoEvidence: EvidenceItem[] = [
    ev("Idioma", s.lang || "indisponível", hasLang ? "ok" : "neutral"),
    ev("Fuso do browser", browserTimezone, tzConsistent ? "ok" : hasLang ? "alert" : "neutral"),
    ev("Geo da request", formatEstimatedGeo(requestGeo), hasRequestGeo ? "ok" : "neutral"),
    ev("Timezone da request", requestGeo?.timezone ?? "indisponível", requestGeo?.timezone ? "ok" : "neutral"),
    ev("Coerência geo", geoConsistent ? "Consistente" : "Divergente", geoConsistent ? "ok" : "alert"),
    ev("Precisão", geoPrecision, "neutral"),
    ev("URL de origem", s.browsingUrl || "—", "neutral"),
  ];

  const geoCard: VerdictCard = {
    id: "geolocation",
    title: "CONTEXTO GEOGRÁFICO",
    verdict: verdict(geo_gained, geo_max),
    verdictLabel: verdict(geo_gained, geo_max) === "confirmed" ? "Consistente" : verdict(geo_gained, geo_max) === "alert" ? "Divergente" : "Inconclusivo",
    explanation: geoConsistent
      ? "Idioma, fuso horário e geo estimada da request são compatíveis. Isto sugere país/região provável, não endereço preciso."
      : "Idioma, fuso horário ou geo estimada apresentam divergência. Pode indicar VPN, proxy, viagem ou configuração regional diferente.",
    scoreGained: geo_gained,
    scoreMax: geo_max,
    evidence: geoEvidence,
  };

  // ── Score final ────────────────────────────────────────────────────────────
  const verdictCards = [fpCard, hwCard, ssCard, afCard, geoCard];
  const totalGained = verdictCards.reduce((a, c) => a + c.scoreGained, 0);
  const totalMax = verdictCards.reduce((a, c) => a + c.scoreMax, 0);
  const riskScore = Math.round((totalGained / totalMax) * 100);
  const riskLevel = riskScore >= 70 ? "low" : riskScore >= 40 ? "medium" : "high";

  const alertCards = verdictCards.filter((c) => c.verdict === "alert").length;
  const summary =
    riskScore >= 70
      ? "Dispositivo com perfil de utilizador real. Baixa probabilidade de manipulação."
      : riskScore >= 40
      ? `${alertCards} categoria${alertCards > 1 ? "s" : ""} com sinais de atenção. Revisão recomendada.`
      : "Múltiplos indicadores de manipulação de fingerprint ou ambiente automatizado.";

  return {
    riskScore,
    riskLevel,
    summary,
    capturedAt: new Date().toISOString(),
    verdictCards,
  };
}

// ─── POST /api/demo/capture ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { token: string; signals: DeviceSignals };

  try {
    body = (await req.json()) as { token: string; signals: DeviceSignals };
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { token, signals } = body;
  if (!token || !signals) {
    return NextResponse.json({ error: "token e signals são obrigatórios." }, { status: 400 });
  }

  const supabase = buildServiceClient();

  const { data: session, error: fetchError } = await supabase
    .from("demo_sessions")
    .select("id, status, expires_at")
    .eq("share_token", token)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  if (session.status === "captured") {
    return NextResponse.json({ ok: true, already: true });
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("demo_sessions").update({ status: "expired" }).eq("id", session.id);
    return NextResponse.json({ error: "Este link expirou." }, { status: 410 });
  }

  const requestGeo = getRequestGeo(req);
  const enrichedSignals: DeviceSignals = { ...signals, requestGeo };
  const insights = generateInsights(enrichedSignals);

  const { error: updateError } = await supabase
    .from("demo_sessions")
    .update({ status: "captured", signals_json: enrichedSignals, insights_json: insights })
    .eq("id", session.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
