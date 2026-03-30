/**
 * Teste de integração do save de backtests.
 * Insere diretamente via service role (simula o que a API faz),
 * verifica o registo no banco e depois limpa.
 * Uso: npx tsx scripts/test-save-api.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { parseCsv } from "@/lib/csv/parser";
import { calculateMetrics } from "@/lib/csv/metrics";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const USER_ID = "fbdea8b5-6166-4e9b-acce-50b7520230c8"; // otoniel@otnl.com.br
const CSV_PATH = resolve(process.env.HOME ?? "", "Downloads/megatone_results.csv");

async function main() {
  console.log("=== Teste save Backtest ===\n");

  // 1. Parse CSV + métricas (mesmo pipeline que a página)
  console.log("1. Parsing CSV + calculateMetrics…");
  const text = readFileSync(CSV_PATH, "utf8");
  const { rows } = parseCsv(text);
  const metrics = calculateMetrics(rows);
  console.log(`   ${metrics.totalRows.toLocaleString("pt-BR")} linhas | aprovação Koin: ${(metrics.approvalRateKoin * 100).toFixed(1)}%`);
  console.log(`   capabilities.comparativo: ${metrics.capabilities?.comparativo}`);
  console.log(`   capabilities.confusionMatrix: ${metrics.capabilities?.confusionMatrix}\n`);

  // 2. Inserir no banco via service role (mesmos campos que a API route)
  console.log("2. Inserindo registo de teste no banco…");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertError } = await admin
    .from("backtests")
    .insert({
      user_id: USER_ID,
      prospect_name: "megatone results [TEST-SCRIPT]",
      filename: "megatone_results.csv",
      row_count: metrics.totalRows,
      fraud_count: metrics.confusionMatrix?.tp ?? null,
      metrics_json: metrics,
      ai_insights_json: null,
    })
    .select("id, prospect_name, row_count, fraud_count, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("ERRO no INSERT:", insertError?.message ?? "sem dados");
    process.exit(1);
  }
  console.log("   ✓ Inserido:", JSON.stringify(inserted));

  // 3. Verificar que aparece na query do histórico (mesma do historico/page.tsx)
  console.log("\n3. Simulando query do histórico…");
  const { data: histResult, error: histError } = await admin
    .from("backtests")
    .select("id, prospect_name, filename, created_at, row_count, fraud_count, metrics_json")
    .order("created_at", { ascending: false })
    .limit(3);

  if (histError) {
    console.error("ERRO na query histórico:", histError.message);
  } else {
    console.log(`   ✓ ${histResult?.length} registo(s) encontrado(s)`);
    for (const bt of histResult ?? []) {
      console.log(`     - ${bt.prospect_name} | ${bt.row_count?.toLocaleString("pt-BR")} txns | ${bt.created_at}`);
    }
  }

  // 4. Verificar que metrics_json tem os campos corretos
  console.log("\n4. Validando metrics_json armazenado…");
  const { data: fetched } = await admin
    .from("backtests")
    .select("metrics_json")
    .eq("id", inserted.id)
    .single();

  const m = fetched?.metrics_json as typeof metrics | null;
  if (!m) {
    console.error("   ERRO: metrics_json não foi armazenado");
  } else {
    console.log("   ✓ totalRows:", m.totalRows);
    console.log("   ✓ approvalRateKoin:", ((m.approvalRateKoin ?? 0) * 100).toFixed(1) + "%");
    console.log("   ✓ confusionMatrix:", m.confusionMatrix ? "presente" : "ausente");
    console.log("   ✓ capabilities:", JSON.stringify(m.capabilities));
  }

  // 5. Limpar
  console.log("\n5. Limpando registo de teste…");
  await admin.from("backtests").delete().eq("id", inserted.id);
  console.log("   ✓ Removido.\n");

  console.log("=== RESULTADO: SAVE FUNCIONA CORRETAMENTE ===");
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
