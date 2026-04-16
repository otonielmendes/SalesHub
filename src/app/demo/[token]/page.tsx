"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import { collectSignals } from "@/lib/fingerprint/collect";
import type { DeviceSignals } from "@/types/demos";

type PageState = "collecting" | "sending" | "done" | "already" | "expired" | "error";
type StepKey = "initializing" | "detecting" | "incognito" | "sending";

interface Props {
  params: Promise<{ token: string }>;
}

// ─── Data display ──────────────────────────────────────────────────────────────

function DataField({ label, value }: { label: string; value: string }) {
  const tooltip = `${label}: ${value}`;

  return (
    <div className="min-w-0 rounded-lg border border-[#EAECF0] bg-white px-3.5 py-3">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="truncate text-xs font-medium text-tertiary">{label}</span>
        <span
          title={tooltip}
          className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-[#D0D5DD] text-xs font-semibold leading-none text-[#667085]"
        >
          i
        </span>
      </div>
      <p className="min-w-0 break-words font-mono text-sm font-medium leading-5 text-primary">{value}</p>
    </div>
  );
}

function DataCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  const t = useTranslations("demos.public");

  return (
    <section className="overflow-hidden rounded-xl border border-[#D0D5DD] bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <h2 className="truncate text-sm font-semibold text-[#10181B]">{title}</h2>
        <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-xs font-medium text-[#667085]">
          {t("fieldsCount", { count: rows.length })}
        </span>
      </div>
      <div className="border-t border-[#EAECF0] px-5 py-4">
        <p className="mb-3 text-sm font-semibold text-[#10181B]">{t("information")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <DataField key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      </div>
    </section>
  );
}

function boolLabel(value: boolean | null | undefined, labels: { yes: string; no: string; inconclusive: string }) {
  if (value == null) return labels.inconclusive;
  return value ? labels.yes : labels.no;
}

function CapturedData({ signals }: { signals: DeviceSignals }) {
  const t = useTranslations("demos.public");
  const s = signals.session;
  const utcOffset = s.timezone >= 0 ? `UTC+${s.timezone}` : `UTC${s.timezone}`;
  const requestGeo = signals.requestGeo;
  const estimatedGeo = requestGeo
    ? [requestGeo.city, requestGeo.region, requestGeo.country].filter(Boolean).join(", ") || "—"
    : "—";
  const pluginList = s.plugins
    ? s.plugins.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="mt-6 w-full space-y-3">
      <DataCard
        title="Identificadores"
        rows={[
          { label: "sessionId", value: signals.sessionId },
          { label: "deviceId", value: signals.deviceId },
          { label: "capturedAt", value: new Date(signals.capturedAt).toLocaleString("pt-BR") },
        ]}
      />

      <DataCard
        title="Agente & Sistema Operativo"
        rows={[
          { label: "userAgent", value: s.userAgent },
          { label: t("fields.system"), value: `${s.os} ${s.osVersion}` },
          { label: t("fields.platform"), value: s.platform },
          { label: t("fields.language"), value: s.lang },
          { label: t("fields.timezone"), value: utcOffset },
          { label: "timezoneName", value: s.timezoneName ?? "—" },
          { label: "browsingUrl", value: s.browsingUrl || "—" },
        ]}
      />

      <DataCard
        title="Contexto geográfico"
        rows={[
          { label: "geo estimada", value: estimatedGeo },
          { label: "país", value: requestGeo?.country ?? "—" },
          { label: "região", value: requestGeo?.region ?? "—" },
          { label: "cidade", value: requestGeo?.city ?? "—" },
          { label: "timezone request", value: requestGeo?.timezone ?? "—" },
          { label: "precisão", value: requestGeo?.precision === "country_region_city_estimate" ? "País/região/cidade aproximados" : "Sem geo da request" },
        ]}
      />

      <DataCard
        title={t("sections.screen")}
        rows={[
          { label: t("fields.resolution"), value: `${s.screen.width} × ${s.screen.height} px` },
          { label: t("fields.available"), value: `${s.screen.availWidth} × ${s.screen.availHeight} px` },
          { label: t("fields.colorDepth"), value: `${s.screen.colorDepth} bit` },
          { label: "devicePixelRatio", value: String(s.devicePixelRatio) },
          { label: t("fields.orientation"), value: s.screen.orientation ?? "null" },
        ]}
      />

      <DataCard
        title="Canvas & GPU"
        rows={[
          { label: "canvasId (SHA-256)", value: s.canvasId ? s.canvasId.slice(0, 24) + "…" : "—" },
          { label: "GPU vendor", value: s.gpuVendor ?? "—" },
          { label: "GPU renderer", value: s.gpuName ?? "—" },
        ]}
      />

      <DataCard
        title="CPU & Memória"
        rows={[
          { label: "CPU cores", value: s.cores != null ? String(s.cores) : "—" },
          { label: t("fields.memory"), value: s.deviceMemory != null ? `${s.deviceMemory} GB` : "—" },
          { label: "cpuSpeed avg", value: s.cpuSpeed.average != null ? `${s.cpuSpeed.average.toFixed(2)} ops/ms` : "null" },
          { label: "cpuSpeed latência", value: s.cpuSpeed.time != null ? `${s.cpuSpeed.time} ms` : "null" },
          { label: "benchmark version", value: `v${s.cpuSpeed.version}` },
        ]}
      />

      <DataCard
        title="Storage & Flags"
        rows={[
          { label: "cookies", value: boolLabel(s.cookiesEnabled, { yes: t("values.active"), no: t("values.blocked"), inconclusive: "null" }) },
          { label: "localStorage", value: boolLabel(s.localStorage, { yes: t("values.active"), no: t("values.blocked"), inconclusive: "null" }) },
          { label: "sessionStorage", value: boolLabel(s.sessionStorage, { yes: t("values.active"), no: t("values.blocked"), inconclusive: "null" }) },
          { label: "indexedDB", value: boolLabel(s.indexedDB, { yes: t("values.active"), no: t("values.blocked"), inconclusive: "null" }) },
          { label: "doNotTrack", value: boolLabel(s.doNotTrack, { yes: t("values.active"), no: t("values.inactive"), inconclusive: "null" }) },
          { label: "privateBrowsing", value: boolLabel(s.privateBrowsing, { yes: t("values.yes"), no: t("values.no"), inconclusive: t("values.inconclusive") }) },
          { label: "javaEnabled", value: boolLabel(s.javaEnabled, { yes: t("values.active"), no: t("values.blocked"), inconclusive: "null" }) },
          { label: "javaScriptEnabled", value: t("values.active") },
          { label: "acceptContent", value: s.acceptContent },
        ]}
      />

      <DataCard
        title={t("sections.plugins")}
        rows={
          pluginList.length > 0
            ? pluginList.map((p, i) => ({ label: `${t("fields.plugin")} ${i + 1}`, value: p }))
            : [{ label: t("fields.extensions"), value: t("values.noneDetected") }]
        }
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PublicDemoPage({ params }: Props) {
  const t = useTranslations("demos.public");
  const { token } = use(params);
  const [state, setState] = useState<PageState>("collecting");
  const [step, setStep] = useState<StepKey>("initializing");
  const [signals, setSignals] = useState<DeviceSignals | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setStep("detecting");
        setState("collecting");

        const captured = await collectSignals();
        setSignals(captured);

        setStep("incognito");
        await new Promise((r) => setTimeout(r, 300));

        setStep("sending");
        setState("sending");

        const res = await fetch("/api/demo/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, signals: captured }),
        });

        if (res.status === 410) { setState("expired"); return; }
        if (!res.ok)            { setState("error");   return; }

        const data = (await res.json()) as { ok: boolean; already?: boolean };
        setState(data.already ? "already" : "done");
      } catch {
        setState("error");
      }
    }

    void run();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Top bar */}
      <div className="border-b border-[#D0D5DD] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-container items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10181B]">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <span className="text-sm font-semibold text-[#10181B]">Fingerprinting Light Demo</span>
          <span className="ml-auto rounded-full border border-[#D0D5DD] px-2.5 py-1 text-xs font-medium text-[#475467]">{t("topLabel")}</span>
        </div>
      </div>

      <main className="mx-auto max-w-container px-6 py-8 pb-16 lg:px-8">

        {/* Collecting / Sending */}
        {(state === "collecting" || state === "sending") && (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border border-[#D0D5DD] bg-white" />
              <div className="absolute inset-2 animate-spin rounded-full border-[2.5px] border-[#EAECF0] border-t-[#0C8525]" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#10181B]">{t("collectingTitle")}</p>
              <p className="mt-1 font-mono text-xs text-[#667085]">{t(`steps.${step}`)}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ABEFC6] bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#067647]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#17B26A]" />
              Live
            </div>
          </div>
        )}

        {/* Done / Already */}
        {(state === "done" || state === "already") && (
          <>
            {/* Success header card */}
            <div className="mb-6 rounded-lg border border-[#75E0A7] bg-[#ECFDF3] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M5 13l4 4L19 7" stroke="#0C8525" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-[#067647]">
                    {state === "done" ? t("doneTitle") : t("alreadyTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#067647]">
                    {t("successDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Signal count badge */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#10181B]">{t("capturedData")}</p>
              <span className="rounded-full border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs font-medium text-[#475467]">
                {t("signalsCount")}
              </span>
            </div>

            {signals && <CapturedData signals={signals} />}
          </>
        )}

        {/* Expired */}
        {state === "expired" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2]">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <circle cx="12" cy="12" r="10" stroke="#F04438" strokeWidth="2" />
                <path d="M12 8v5l3 3" stroke="#F04438" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#10181B]">{t("expiredTitle")}</p>
              <p className="mt-1 text-sm text-[#667085]">{t("expiredDesc")}<br />{t("expiredAction")}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2]">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#F04438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#10181B]">{t("errorTitle")}</p>
              <p className="mt-1 text-sm text-[#667085]">{t("errorDesc")}<br />{t("errorAction")}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg border border-[#E4E7EC] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-sm transition-colors hover:bg-[#F9FAFB]"
            >
              {t("reload")}
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-[#98A2B3]">
          {t("footer")}
        </p>
      </main>
    </div>
  );
}
