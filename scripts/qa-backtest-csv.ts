/**
 * QA offline: corre o mesmo pipeline que a página Testagens (parse + métricas).
 * Uso: npx tsx scripts/qa-backtest-csv.ts [caminho.csv]
 * Predefinição: ~/Downloads/megatone_results.csv
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "@/lib/csv/parser";
import { calculateMetrics } from "@/lib/csv/metrics";

const defaultPath = resolve(
  process.env.HOME ?? process.env.USERPROFILE ?? "",
  "Downloads/megatone_results.csv",
);

const csvPath = process.argv[2] ? resolve(process.argv[2]) : defaultPath;

function main() {
  console.log("=== QA Backtest CSV (Sales Hub) ===\n");
  console.log("Ficheiro:", csvPath);

  if (!existsSync(csvPath)) {
    console.error("ERRO: ficheiro não encontrado.");
    process.exit(1);
  }

  const text = readFileSync(csvPath, "utf8");
  console.log("Tamanho (chars):", text.length.toLocaleString("pt-BR"));

  console.time("parseCsv");
  const { rows, colMap } = parseCsv(text);
  console.timeEnd("parseCsv");

  console.log("\n--- colMap ---");
  for (const [k, v] of Object.entries(colMap)) {
    console.log(`  ${k}: ${v ?? "(não detetado)"}`);
  }

  console.log("\nLinhas parseadas:", rows.length.toLocaleString("pt-BR"));
  if (rows.length === 0) {
    console.error("ERRO: zero linhas.");
    process.exit(1);
  }

  console.time("calculateMetrics");
  const metrics = calculateMetrics(rows);
  console.timeEnd("calculateMetrics");

  const cm = metrics.confusionMatrix;
  console.log("\n--- métricas (resumo) ---");
  console.log("totalRows:", metrics.totalRows);
  console.log("approvalRateToday:", (metrics.approvalRateToday * 100).toFixed(2) + "%");
  console.log("approvalRateKoin:", (metrics.approvalRateKoin * 100).toFixed(2) + "%");
  console.log("recoverableTransactions:", metrics.recoverableTransactions);
  console.log(
    "detectionRate:",
    cm ? (cm.detectionRate * 100).toFixed(2) + "%" : "n/a",
  );
  console.log("preventedPct:", metrics.preventedPct != null ? (metrics.preventedPct * 100).toFixed(2) + "%" : "n/a");
  console.log("capabilities.comparativo:", metrics.capabilities?.comparativo);
  console.log("capabilities.confusionMatrix:", metrics.capabilities?.confusionMatrix);

  console.log("\n=== QA CSV: OK ===");
}

main();
