"use client";

import { createClient } from "@/lib/supabase/client";
import { Assessment, AssessmentFormData } from "./types";

function getSupabase() {
  return createClient();
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAllAssessments(): Promise<Assessment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching assessments:", error);
    return [];
  }

  return (data as Assessment[]) || [];
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching assessment:", error);
    return null;
  }

  return data as Assessment;
}

export async function createAssessment(data: AssessmentFormData): Promise<Assessment | null> {
  const supabase = getSupabase();

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Usuário não autenticado.");

  const payload = { ...data, user_id: userId };

  const { data: created, error } = await supabase
    .from("assessments")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating assessment:", error);
    throw new Error(`Supabase: ${error.message} (code: ${error.code})`);
  }

  return created as Assessment;
}

export async function updateAssessment(
  id: string,
  data: Partial<AssessmentFormData>
): Promise<Assessment | null> {
  const supabase = getSupabase();
  const { data: updated, error } = await supabase
    .from("assessments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating assessment:", error);
    return null;
  }

  return updated as Assessment;
}

export async function deleteAssessment(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("assessments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting assessment:", error);
    return false;
  }

  return true;
}

export async function getDefaultFormData(): Promise<AssessmentFormData> {
  const userId = (await getCurrentUserId()) ?? "";
  return {
    user_id: userId,
    status: "draft",
    merchant_name: "",
    vertical: "E-commerce",
    volume_mensal: "10k–50k",
    ticket_medio: 0,
    modelo_negocio: "B2C",
    pct_volume_cartao: 100,
    opera_crossborder: false,
    crossborder_paises: "",
    tem_programa_fidelidade: false,
    taxa_aprovacao: 0,
    taxa_chargeback: 0,
    taxa_decline: 0,
    pct_revisao_manual: undefined,
    challenge_rate_3ds: undefined,
    challenge_rate_outras: undefined,
    taxa_false_decline: undefined,
    tempo_revisao_manual: undefined,
    solucao_atual: "Nenhuma",
    dores: [],
    tem_regras_customizadas: undefined,
    validacao_identidade_onboarding: undefined,
    device_fingerprinting: undefined,
    monitora_behavioral_signals: undefined,
    origem_fraude: [],
    notas_comercial: "",
  };
}
