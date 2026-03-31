export type Vertical =
  | "E-commerce"
  | "Fintech"
  | "Marketplace"
  | "Delivery"
  | "Digital Goods"
  | "Travel"
  | "Subscription"
  | "Outro";

export type VolumeRange =
  | "< 10k"
  | "10k–50k"
  | "50k–200k"
  | "200k–1M"
  | "> 1M";

export type BusinessModel =
  | "B2C"
  | "B2B"
  | "Marketplace (com sellers)"
  | "Outro";

export type ReviewTimeRange =
  | "< 1h"
  | "1–4h"
  | "4–12h"
  | "12–24h"
  | "> 24h";

export type CurrentSolution =
  | "Konduto"
  | "ClearSale"
  | "Cybersource"
  | "SEON"
  | "Kount"
  | "Signifyd"
  | "ThreatMetrix"
  | "Nethone"
  | "In-house"
  | "Nenhuma"
  | "Outra";

export type Pain =
  | "Chargeback alto"
  | "Muita revisão manual"
  | "Aprovação baixa"
  | "Fraude em crescimento"
  | "Expansão para novos mercados"
  | "Account Takeover (ATO)"
  | "Compliance";

export type FraudOrigin =
  | "Contas novas"
  | "ATO (contas existentes)"
  | "Friendly fraud / abuso de políticas";

export type YesNoUnknown = "Sim" | "Não" | "Não sei";
export type YesNoPartial = "Sim" | "Não" | "Parcial";

export interface Assessment {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: "draft" | "complete";

  merchant_name: string;
  vertical: Vertical;
  volume_mensal: VolumeRange;
  ticket_medio: number;
  modelo_negocio: BusinessModel;
  pct_volume_cartao: number;
  pct_volume_pix?: number;
  pct_volume_apms?: number;
  opera_crossborder: boolean;
  crossborder_paises?: string;
  tem_programa_fidelidade: boolean;

  taxa_aprovacao: number;
  taxa_chargeback: number;
  taxa_decline: number;
  pct_revisao_manual?: number;
  challenge_rate_3ds?: number;
  challenge_rate_outras?: number;
  taxa_false_decline?: number;
  tempo_revisao_manual?: ReviewTimeRange;
  solucao_atual: CurrentSolution;

  dores: Pain[];
  tem_regras_customizadas?: YesNoUnknown;
  validacao_identidade_onboarding?: YesNoPartial;
  device_fingerprinting?: YesNoUnknown;
  monitora_behavioral_signals?: YesNoUnknown;
  origem_fraude: FraudOrigin[];
  notas_comercial?: string;
}

export type AssessmentFormData = Omit<Assessment, "id" | "created_at" | "updated_at">;

export interface DiagnosticInsight {
  id: string;
  priority: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  insight: string;
  recommendation?: string;
}
