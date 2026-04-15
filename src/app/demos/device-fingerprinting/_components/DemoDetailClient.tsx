"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Browser,
  CpuChip01,
  EyeOff,
  Fingerprint01,
  Globe05,
  Shield01,
} from "@untitledui/icons";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Tabs } from "@/components/application/tabs/tabs";
import type {
  DemoSession,
  DeviceSignals,
  DeviceInsights,
  VerdictCard,
  EvidenceItem,
  EvidenceStatus,
} from "@/types/demos";

interface Props {
  session: DemoSession;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DemoSession["status"] }) {
  const t = useTranslations("demos.common");
  if (status === "captured") return <Badge color="success">{t("statusCaptured")}</Badge>;
  if (status === "expired") return <Badge color="gray">{t("statusExpired")}</Badge>;
  return <Badge color="brand">{t("statusPending")}</Badge>;
}

function MetricIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2F4F6] text-[#98A2B3]">
      {children}
    </div>
  );
}

function HeaderMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <MetricIcon>{icon}</MetricIcon>
      <span className="text-sm leading-6 text-[#475456]">
        {label}: <span className="font-semibold text-[#10181B]">{value}</span>
      </span>
    </div>
  );
}

function DemoHeaderCard({
  session,
  locale,
}: {
  session: DemoSession;
  locale: string;
}) {
  const t = useTranslations("demos.detail");
  const tc = useTranslations("demos.common");
  const insights = session.insights_json;
  const score = insights?.riskScore != null ? `${insights.riskScore}/100` : t("waitingValue");
  const signalCount = session.signals_json ? t("signalsCount") : t("waitingValue");

  return (
    <section className="mb-6 flex w-full flex-col items-start justify-center gap-4 rounded-2xl border border-[#D0D5DD] bg-white p-6">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold leading-8 text-[#10181B]">
            {session.prospect_name ?? tc("fallbackUnnamedSession")}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
              {tc("deviceFingerprinting")}
            </span>
            <StatusBadge status={session.status} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            color="tertiary"
            size="md"
            className="ring-1 ring-secondary ring-inset"
            onClick={() => {
              void navigator.clipboard.writeText(`${window.location.origin}/demo/${session.share_token}`);
            }}
          >
            {t("copyLink")}
          </Button>
          <Button size="md" href="/demos/device-fingerprinting/nova">
            {t("newDemo")}
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-[#EAECEE]" />

      <div className="flex w-full flex-wrap items-center gap-4">
        <HeaderMetric
          label={t("scoreLabel")}
          value={score}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2.5v11M3.5 8h9" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
            </svg>
          }
        />
        <HeaderMetric
          label={t("signalsLabel")}
          value={signalCount}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 12.5V7.5M8 12.5V3.5M13 12.5V5.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
            </svg>
          }
        />
        <HeaderMetric
          label={t("createdLabel")}
          value={new Date(session.created_at).toLocaleString(locale)}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5.333 1.667V4M10.667 1.667V4M2.667 6.333h10.666M4 3h8a1.333 1.333 0 0 1 1.333 1.333V12A1.333 1.333 0 0 1 12 13.333H4A1.333 1.333 0 0 1 2.667 12V4.333A1.333 1.333 0 0 1 4 3Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
            </svg>
          }
        />
        <HeaderMetric
          label={t("expiresLabel")}
          value={new Date(session.expires_at).toLocaleString(locale)}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 4.667V8l2 1.333M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>
    </section>
  );
}

// ─── Pending state ─────────────────────────────────────────────────────────────

function PendingState({ session }: { session: DemoSession }) {
  const t = useTranslations("demos.detail");
  const [nowMs, setNowMs] = useState<number | null>(null);
  const shareUrl = nowMs == null ? "" : `${window.location.origin}/demo/${session.share_token}`;

  useEffect(() => {
    const updateNow = () => setNowMs(Date.now());
    updateNow();
    const interval = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const remaining =
    nowMs == null
      ? null
      : Math.max(0, Math.floor((new Date(session.expires_at).getTime() - nowMs) / 1000 / 60));
  const hh = remaining == null ? "--" : String(Math.floor(remaining / 60)).padStart(2, "0");
  const mm = remaining == null ? "--" : String(remaining % 60).padStart(2, "0");

  return (
    <div className="rounded-lg border border-[#D0D5DD] bg-white p-8">
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-[#FEDF89] bg-[#FFFAEB]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-[#DC6803]" />
        </div>
        <h2 className="text-lg font-semibold text-primary">{t("pendingTitle")}</h2>
        <p className="mt-1 max-w-sm text-sm text-tertiary">
          {t("pendingDesc")}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-warning-500" />
          <span className="font-semibold text-warning-700">{t("pendingPermissions")}</span>
        </div>
        <span className="font-mono text-xs text-warning-600">
          {t("remaining", { token: session.share_token.slice(0, 8), time: `${hh}:${mm}` })}
        </span>
      </div>
      {shareUrl && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-[#F9FAFB] px-3.5 py-2.5">
          <span className="flex-1 truncate font-mono text-xs text-tertiary">{shareUrl}</span>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="shrink-0 rounded px-2 py-1 text-xs font-medium text-brand-secondary hover:bg-[#EAECEE]"
          >
            {t("copy")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: "dados" | "insights"; onChange: (t: "dados" | "insights") => void }) {
  const t = useTranslations("demos.detail");
  return (
    <Tabs
      selectedKey={active}
      onSelectionChange={(key) => onChange(key as "dados" | "insights")}
    >
      <Tabs.List
        type="button-border"
        size="md"
        className="w-max max-w-full overflow-x-auto"
        items={[
          { id: "dados", label: t("tabsData") },
          { id: "insights", label: t("tabsInsights") },
        ]}
      >
        {(item) => <Tabs.Item id={item.id}>{item.label}</Tabs.Item>}
      </Tabs.List>
    </Tabs>
  );
}

// ─── DADOS tab ─────────────────────────────────────────────────────────────────

function BoolBadge({ v }: { v: boolean | null | undefined }) {
  const t = useTranslations("demos.detail");
  if (v == null) return <Badge color="gray" size="sm">null</Badge>;
  return v
    ? <Badge color="success" size="sm">{t("active")}</Badge>
    : <Badge color="error" size="sm">{t("blocked")}</Badge>;
}

interface DataRow {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function FieldBox({ row }: { row: DataRow }) {
  const tooltip =
    typeof row.value === "string" || typeof row.value === "number"
      ? `${row.label}: ${row.value}`
      : row.label;

  return (
    <div className="min-w-0 rounded-lg border border-[#EAECF0] bg-white px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="truncate text-xs font-medium text-tertiary">{row.label}</span>
        <span
          title={tooltip}
          className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-[#D0D5DD] text-xs font-semibold leading-none text-[#667085]"
        >
          i
        </span>
      </div>
      <div className={`min-w-0 break-words text-sm font-medium leading-5 text-primary ${row.mono !== false ? "font-mono" : ""}`}>
        {row.value}
      </div>
    </div>
  );
}

function SectionIcon({ title }: { title: string }) {
  const tone = title.includes("Storage") || title.includes("Plugins")
    ? "border-[#ABEFC6] bg-[#ECFDF3] text-[#0C8525]"
    : title.includes("Canvas") || title.includes("CPU")
      ? "border-[#FEDF89] bg-[#FFFAEB] text-[#D97706]"
      : "border-[#EAECF0] bg-[#F9FAFB] text-[#667085]";

  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${tone}`}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3.333 4.667A1.333 1.333 0 0 1 4.667 3.333h6.666a1.333 1.333 0 0 1 1.334 1.334v6.666a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4.667Z" stroke="currentColor" strokeWidth="1.33" />
        <path d="M6 6h4M6 8h4M6 10h2.667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function SectionTable({ title, rows }: { title: string; rows: DataRow[] }) {
  const t = useTranslations("demos.detail");
  return (
    <section className="overflow-hidden rounded-xl border border-[#D0D5DD] bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <SectionIcon title={title} />
          <h2 className="truncate text-sm font-semibold text-primary">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-xs font-medium text-tertiary">
            {t("fieldsCount", { count: rows.length })}
          </span>
          <span className="text-xs font-semibold text-success-700">ver menos</span>
        </div>
      </div>
      <div className="border-t border-[#EAECF0] px-5 py-4">
        <p className="mb-3 text-sm font-semibold text-primary">Informações</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => <FieldBox key={row.label} row={row} />)}
        </div>
      </div>
    </section>
  );
}

function DadosTab({ signals }: { signals: DeviceSignals }) {
  const t = useTranslations("demos.detail");
  const s = signals.session;
  const utcLabel = `UTC${s.timezone >= 0 ? "+" : ""}${s.timezone}`;

  const pluginList = s.plugins
    ? s.plugins.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-3">
      <SectionTable title="Identificadores" rows={[
        { label: "sessionId", value: signals.sessionId },
        { label: "deviceId", value: signals.deviceId },
        { label: "capturedAt", value: new Date(signals.capturedAt).toLocaleString("pt-BR"), mono: false },
      ]} />

      <SectionTable title="Agente & Sistema Operativo" rows={[
        { label: "userAgent", value: s.userAgent },
        { label: "sistema", value: `${s.os} · ${s.osVersion}`, mono: false },
        { label: "platform", value: s.platform },
        { label: "lang", value: s.lang },
        { label: "timezone", value: utcLabel },
        { label: "browsingUrl", value: s.browsingUrl || <span className="text-tertiary italic">—</span> },
      ]} />

      <SectionTable title="Ecrã" rows={[
        { label: "resolução", value: `${s.screen.width} × ${s.screen.height} px` },
        { label: "área disponível", value: `${s.screen.availWidth} × ${s.screen.availHeight} px` },
        { label: "colorDepth", value: `${s.screen.colorDepth} bit` },
        { label: "devicePixelRatio", value: String(s.devicePixelRatio) },
        { label: "orientação", value: s.screen.orientation ?? <span className="text-tertiary">null</span> },
      ]} />

      <SectionTable title="Canvas & GPU" rows={[
        {
          label: "canvasId (SHA-256)",
          value: s.canvasId
            ? <span title={s.canvasId}>{s.canvasId.slice(0, 24)}…</span>
            : <Badge color="error" size="sm">{t("blocked")}</Badge>,
        },
        { label: "gpuVendor", value: s.gpuVendor ?? <Badge color="gray" size="sm">{t("unavailable")}</Badge> },
        { label: "gpuName", value: s.gpuName ?? <Badge color="gray" size="sm">{t("unavailable")}</Badge> },
      ]} />

      <SectionTable title="CPU & Memória" rows={[
        { label: t("logicalCores"), value: s.cores != null ? String(s.cores) : <Badge color="gray" size="sm">{t("unavailable")}</Badge> },
        { label: "deviceMemory", value: s.deviceMemory != null ? `${s.deviceMemory} GB` : <Badge color="gray" size="sm">{t("unavailable")}</Badge> },
        { label: "cpuSpeed avg", value: s.cpuSpeed.average != null ? `${s.cpuSpeed.average.toFixed(2)} ops/ms` : <Badge color="gray" size="sm">null</Badge> },
        { label: "cpuSpeed latência", value: s.cpuSpeed.time != null ? `${s.cpuSpeed.time} ms` : <Badge color="gray" size="sm">null</Badge> },
        { label: "benchmark version", value: `v${s.cpuSpeed.version}` },
      ]} />

      <SectionTable title="Storage & Flags" rows={[
        { label: "cookies", value: <BoolBadge v={s.cookiesEnabled} />, mono: false },
        { label: "localStorage", value: <BoolBadge v={s.localStorage} />, mono: false },
        { label: "sessionStorage", value: <BoolBadge v={s.sessionStorage} />, mono: false },
        { label: "indexedDB", value: <BoolBadge v={s.indexedDB} />, mono: false },
        { label: "doNotTrack", value: <BoolBadge v={s.doNotTrack} />, mono: false },
        { label: "privateBrowsing", value: <BoolBadge v={s.privateBrowsing} />, mono: false },
        { label: "javaEnabled", value: <BoolBadge v={s.javaEnabled} />, mono: false },
        { label: "javaScriptEnabled", value: <Badge color="success" size="sm">{t("active")}</Badge>, mono: false },
        { label: "acceptContent", value: s.acceptContent },
      ]} />

      <SectionTable
        title="Plugins & Extensões"
        rows={
          pluginList.length > 0
            ? pluginList.map((p, i) => ({ label: `plugin ${i + 1}`, value: p }))
            : [{ label: t("extensions"), value: <Badge color="gray" size="sm">{t("noneDetected")}</Badge>, mono: false }]
        }
      />
    </div>
  );
}

// ─── INSIGHTS tab ──────────────────────────────────────────────────────────────

function ScoreRing({ score, level }: { score: number; level: string }) {
  const t = useTranslations("demos.detail");
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = level === "low" ? "#0C8525" : level === "medium" ? "#D97706" : "#DC2626";
  const bgColor = level === "low" ? "#DCFAE6" : level === "medium" ? "#FEF3C7" : "#FEE2E2";
  const levelLabel = level === "low" ? t("lowRisk") : level === "medium" ? t("mediumRisk") : t("highRisk");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="66" cy="66" r={radius} fill="none" stroke="#F2F4F7" strokeWidth="12" />
          <circle
            cx="66" cy="66" r={radius} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-tertiary">/ 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: bgColor, color }}
      >
        {levelLabel}
      </span>
    </div>
  );
}

function ScoreComposition({ cards }: { cards: VerdictCard[] }) {
  const t = useTranslations("demos.detail");

  return (
    <div className="rounded-xl border border-[#D0D5DD] bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#EAECF0] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E4FBE9] text-[#0C8525] ring-1 ring-inset ring-[#10B132]">
            <Shield01 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-[#10181B]">{t("scoreComposition")}</h2>
        </div>
        <span className="rounded-full border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs font-medium text-tertiary">
          {t("dimensions", { count: cards.length })}
        </span>
      </div>

      <div className="space-y-3">
        {cards.map((card) => {
          const pct = Math.max(0, Math.min(100, Math.round((card.scoreGained / card.scoreMax) * 100)));
          const barColor = card.verdict === "alert" ? "bg-warning-500" : card.verdict === "inconclusive" ? "bg-[#98A2B3]" : "bg-success-600";
          const scoreColor = card.verdict === "alert" ? "text-warning-700" : card.verdict === "inconclusive" ? "text-tertiary" : "text-success-700";

          return (
            <div key={card.id} className="grid grid-cols-[180px_minmax(0,1fr)_64px] items-center gap-4">
              <span className="truncate text-sm text-[#475456]">{card.title}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EAECF0]">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-right text-sm font-medium ${scoreColor}`}>
                {card.scoreGained}/{card.scoreMax}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerdictIconGlyph({ id }: { id: string }) {
  switch (id) {
    case "fingerprint":
      return <Fingerprint01 className="h-6 w-6" />;
    case "hardware":
      return <CpuChip01 className="h-6 w-6" />;
    case "session":
      return <Browser className="h-6 w-6" />;
    case "antifingerprint":
      return <EyeOff className="h-6 w-6" />;
    case "geolocation":
      return <Globe05 className="h-6 w-6" />;
    default:
      return <Shield01 className="h-6 w-6" />;
  }
}

function VerdictIcon({ card }: { card: VerdictCard }) {
  const isConfirmed = card.verdict === "confirmed";
  const isAlert = card.verdict === "alert";

  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
        isConfirmed
          ? "bg-[#E4FBE9] text-[#0C8525] ring-1 ring-inset ring-[#10B132]"
          : isAlert
            ? "bg-[#FFFAEB] text-[#B54708] ring-1 ring-inset ring-[#FEDF89]"
            : "bg-[#F2F4F6] text-[#344043]"
      }`}
    >
      <VerdictIconGlyph id={card.id} />
    </span>
  );
}

function EvidenceStatusIcon({ status }: { status: EvidenceStatus }) {
  if (status === "ok") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCFAE6] text-[#0C8525]">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === "alert") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706]">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M8 5.5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F2F4F7] text-[#98A2B3]">
      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function EvidenceInfo({ item }: { item: EvidenceItem }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#98A2B3] text-xs font-semibold leading-none text-[#667085]">
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-64 -translate-x-1/2 rounded-lg bg-[#10181B] px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg group-hover:block">
        {item.label}: {item.value}
      </span>
    </span>
  );
}

function EvidenceGrid({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#EAECF0] bg-white px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-xs font-medium text-tertiary">
                {item.label}
              </span>
              <EvidenceInfo item={item} />
            </div>
            <EvidenceStatusIcon status={item.status} />
          </div>
          <p className="break-words font-mono text-sm font-medium leading-5 text-[#10181B]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function VerdictCardUI({ card }: { card: VerdictCard }) {
  const t = useTranslations("demos.detail");
  const isConfirmed = card.verdict === "confirmed";
  const isAlert = card.verdict === "alert";

  const badgeColor: "success" | "warning" | "gray" = isConfirmed ? "success" : isAlert ? "warning" : "gray";
  const scoreColor = isConfirmed ? "text-success-700" : isAlert ? "text-warning-700" : "text-tertiary";
  const scoreBarColor = isConfirmed ? "bg-success-500" : isAlert ? "bg-warning-500" : "bg-[#D0D5DD]";
  const scorePercent = Math.max(0, Math.min(100, Math.round((card.scoreGained / card.scoreMax) * 100)));

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white">
      <div className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 gap-4">
          <VerdictIcon card={card} />
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">{card.title}</p>
            <p className="mt-1 text-sm leading-6 text-tertiary">{card.explanation}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-semibold text-success-700">ver menos</span>
          <Badge color={badgeColor} size="sm">{card.verdictLabel}</Badge>
        </div>
      </div>

      <div className="border-t border-[#EAECF0] px-6 py-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">{t("evidence")}</p>
          <span className={`text-sm font-semibold tabular-nums ${scoreColor}`}>
            {card.scoreGained}/{card.scoreMax} pts
          </span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#EAECF0]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <EvidenceGrid items={card.evidence} />
      </div>
    </section>
  );
}

function InsightSidebar({ insights, cards }: { insights: DeviceInsights; cards: VerdictCard[] }) {
  const t = useTranslations("demos.detail");
  const alerts = cards.filter((card) => card.verdict === "alert");
  const confirmed = cards.filter((card) => card.verdict === "confirmed");

  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <section className="rounded-xl border border-[#D0D5DD] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">Scoring Koin</p>
          <Badge color={insights.riskLevel === "low" ? "success" : insights.riskLevel === "medium" ? "warning" : "error"} size="sm">
            {insights.riskLevel === "low" ? t("lowRisk") : insights.riskLevel === "medium" ? t("mediumRisk") : t("highRisk")}
          </Badge>
        </div>
        <ScoreRing score={insights.riskScore} level={insights.riskLevel} />
        <div className="mt-5 border-t border-[#EAECF0] pt-4">
          <p className="text-sm font-semibold text-primary">Sobre a análise</p>
          <p className="mt-2 text-sm leading-5 text-tertiary">{insights.summary}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[#D0D5DD] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">Insights gerais</p>
          <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-xs font-medium text-tertiary">
            {cards.length} insights
          </span>
        </div>
        <div className="space-y-2">
          {alerts.map((card) => (
            <div key={card.id} className="rounded-md bg-[#FFFAEB] px-2.5 py-1.5 text-xs font-medium text-warning-800">
              {card.title}: {card.scoreGained}/{card.scoreMax}
            </div>
          ))}
          {confirmed.slice(0, 3).map((card) => (
            <div key={card.id} className="rounded-md bg-[#ECFDF3] px-2.5 py-1.5 text-xs font-medium text-success-800">
              {card.title}: {card.scoreGained}/{card.scoreMax}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function InsightsTab({ insights }: { insights: DeviceInsights }) {
  const t = useTranslations("demos.detail");
  // Guard: sessões antigas sem verdictCards
  const cards = insights.verdictCards ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <InsightSidebar insights={insights} cards={cards} />
      {cards.length > 0 ? (
        <div className="space-y-4">
          <ScoreComposition cards={cards} />
          {cards.map((card) => (
            <VerdictCardUI key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#D0D5DD] bg-white p-10 text-center text-sm text-tertiary">
          {t("legacy")}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DemoDetailClient({ session: initialSession }: Props) {
  const [session, setSession] = useState<DemoSession>(initialSession);
  const [activeTab, setActiveTab] = useState<"dados" | "insights">("insights");
  const locale = useLocale();
  const t = useTranslations("demos.detail");

  useEffect(() => {
    if (session.status === "captured") return;
    const supabase = createClient();
    let cancelled = false;

    const refreshSession = async () => {
      const { data, error } = await supabase
        .from("demo_sessions")
        .select("*")
        .eq("id", session.id)
        .single();

      if (!cancelled && !error && data) {
        setSession((prev) => ({ ...prev, ...(data as DemoSession) }));
      }
    };

    const channel = supabase
      .channel(`demo_${session.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "demo_sessions",
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setSession((prev) => ({ ...prev, ...(payload.new as DemoSession) }));
      })
      .subscribe();

    const interval = window.setInterval(() => {
      void refreshSession();
    }, 3_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [session.id, session.status]);

  return (
    <div className="space-y-4">
      <DemoHeaderCard session={session} locale={locale} />

      {session.status !== "captured" || !session.signals_json ? (
        <PendingState session={session} />
      ) : (
        <>
          <TabBar active={activeTab} onChange={setActiveTab} />
          {activeTab === "dados" ? (
            <DadosTab signals={session.signals_json} />
          ) : (
            <InsightsTab
              insights={session.insights_json ?? { riskScore: 0, riskLevel: "high", summary: t("noInsights"), capturedAt: "", verdictCards: [] }}
            />
          )}
        </>
      )}
    </div>
  );
}
