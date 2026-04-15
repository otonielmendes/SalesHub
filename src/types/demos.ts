export type DemoSessionStatus = "pending" | "captured" | "expired";

export interface DemoSession {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  status: DemoSessionStatus;
  prospect_name: string | null;
  share_token: string;
  signals_json: DeviceSignals | null;
  insights_json: DeviceInsights | null;
}

// ─── Device Signals ────────────────────────────────────────────────────────────

export interface DeviceSignals {
  sessionId: string;
  deviceId: string;
  capturedAt: string;
  session: SessionSignals;
  requestGeo?: RequestGeoSignals | null;
}

export interface SessionSignals {
  userAgent: string;
  os: string;
  osVersion: string;
  platform: string;
  lang: string;
  timezone: number;
  timezoneName?: string | null;
  browsingUrl: string;
  screen: ScreenSignals;
  cpuSpeed: CpuSpeedResult;
  plugins: string;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  canvasId: string | null;
  gpuVendor: string | null;
  gpuName: string | null;
  cores: number | null;
  deviceMemory: number | null;
  devicePixelRatio: number;
  privateBrowsing: boolean | null;
  acceptContent: string;
  javaEnabled: boolean;
  javaScriptEnabled: true;
}

export interface RequestGeoSignals {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  source: "vercel" | "unavailable";
  precision: "country_region_city_estimate" | "unavailable";
}

export interface ScreenSignals {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  availLeft: number | null;
  availTop: number | null;
  colorDepth: number;
  orientation: string | null;
}

export interface CpuSpeedResult {
  average: number | null;
  time: number | null;
  version: number;
}

// ─── Device Insights ───────────────────────────────────────────────────────────

export type InsightSeverity = "high" | "medium" | "low";

/** Status de uma evidência individual dentro de um verdict card */
export type EvidenceStatus = "ok" | "alert" | "neutral";

/** Status do veredito de uma macro-categoria */
export type VerdictStatus = "confirmed" | "alert" | "inconclusive";

/** Um sinal individual apresentado como evidência dentro de um VerdictCard */
export interface EvidenceItem {
  label: string;        // ex: "GPU Renderer"
  value: string;        // ex: "Apple M3"
  status: EvidenceStatus;
}

/** Macro-categoria de análise — resultado do cruzamento de sinais */
export interface VerdictCard {
  id: string;                   // ex: "fingerprint", "hardware", "session"
  title: string;                // ex: "FINGERPRINT ÚNICO"
  verdict: VerdictStatus;
  verdictLabel: string;         // ex: "Confirmado", "Atenção", "Inconclusivo"
  explanation: string;          // 1–2 linhas explicando o veredito
  scoreGained: number;          // pontos efectivamente atribuídos
  scoreMax: number;             // pontos máximos possíveis desta categoria
  evidence: EvidenceItem[];     // sinais que fundamentaram o veredito
}

export interface DeviceInsights {
  riskScore: number;            // 0–100
  riskLevel: InsightSeverity;
  summary: string;
  capturedAt: string;

  verdictCards: VerdictCard[];  // 5 macro-categorias
}

// Legacy — mantido para compatibilidade com sessões antigas
export type InsightCategory = "privacy" | "hardware" | "browser" | "network" | "environment";
export type ThreatStatus = "detected" | "not_detected" | "unknown";
export interface ThreatVector {
  id: string;
  label: string;
  description: string;
  status: ThreatStatus;
}
export interface ScoreDimension {
  label: string;
  score: number;
  max: number;
}
export interface SessionIdentifier {
  type: "session_id" | "device_id" | "canvas_hash";
  label: string;
  value: string;
  description: string;
}
export interface SignalQuadrant {
  title: string;
  fields: { label: string; value: string; tag?: string }[];
}
export interface InsightItem {
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  description: string;
}
