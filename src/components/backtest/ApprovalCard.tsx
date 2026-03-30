import { Target04 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface ApprovalSection {
  label: string;
  koinRate: number;
  otherRate: number;
  totalRows: number;
  /** Positive delta = Koin performs better (used to determine arrow direction) */
  delta: number;
  /** For approvals: positive delta is good. For rejections: negative delta is good. */
  positiveIsGood: boolean;
  footer?: string;
}

function DeltaBadge({
  delta,
  positiveIsGood,
}: {
  delta: number;
  positiveIsGood: boolean;
}) {
  if (!isFinite(delta) || delta === 0) return null;
  const koinIsBetter = positiveIsGood ? delta > 0 : delta < 0;
  const absDelta = Math.abs(delta);

  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
        koinIsBetter ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700",
      )}
    >
      {koinIsBetter ? "↑" : "↓"} {absDelta.toFixed(0)}%
    </span>
  );
}

function fmtRate(rate: number): string {
  if (!isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtCount(rate: number, total: number): string {
  if (!isFinite(rate)) return "—";
  return `${Math.round(rate * total).toLocaleString("pt-BR")} transações`;
}

function SectionCard({ section }: { section: ApprovalSection }) {
  const hasData = isFinite(section.koinRate) || isFinite(section.otherRate);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Section label */}
      <div className="px-4 pt-4 pb-3">
        <span className="text-sm font-semibold text-gray-700">{section.label}</span>
      </div>

      {/* Two columns: Koin | Outro */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
        {/* Koin */}
        <div className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Koin</span>
            {hasData && <DeltaBadge delta={section.delta} positiveIsGood={section.positiveIsGood} />}
          </div>
          <span className="font-mono text-2xl font-bold leading-none text-gray-900">
            {fmtRate(section.koinRate)}
          </span>
          <span className="text-xs text-gray-400">
            {fmtCount(section.koinRate, section.totalRows)}
          </span>
        </div>

        {/* Outro / Merchant */}
        <div className="flex flex-col gap-1 px-4 py-3">
          <span className="text-xs font-medium text-gray-500">Outro</span>
          <span className="font-mono text-2xl font-bold leading-none text-gray-900">
            {fmtRate(section.otherRate)}
          </span>
          <span className="text-xs text-gray-400">
            {fmtCount(section.otherRate, section.totalRows)}
          </span>
        </div>
      </div>

      {/* Footer */}
      {section.footer && (
        <div className="border-t border-gray-100 bg-success-50 px-4 py-2.5 text-xs font-medium text-success-700">
          {section.footer}
        </div>
      )}
    </div>
  );
}

interface ApprovalCardProps {
  title: string;
  approvalKoin: number;
  approvalOther: number;
  rejectionKoin: number;
  rejectionOther: number;
  totalRows: number;
  approvalFooter?: string;
  rejectionFooter?: string;
}

export function ApprovalCard({
  title,
  approvalKoin,
  approvalOther,
  rejectionKoin,
  rejectionOther,
  totalRows,
  approvalFooter,
  rejectionFooter,
}: ApprovalCardProps) {
  const approvalDelta = (approvalKoin - approvalOther) * 100;
  const rejectionDelta = (rejectionKoin - rejectionOther) * 100;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-xs">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-full bg-success-100">
          <Target04 className="size-5 text-success-600" />
        </div>
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>

      {/* Two section cards side by side */}
      <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
        <SectionCard
          section={{
            label: "Aprovado",
            koinRate: approvalKoin,
            otherRate: approvalOther,
            totalRows,
            delta: approvalDelta,
            positiveIsGood: true,
            footer: approvalFooter,
          }}
        />
        <SectionCard
          section={{
            label: "Rejeitado",
            koinRate: rejectionKoin,
            otherRate: rejectionOther,
            totalRows,
            delta: rejectionDelta,
            positiveIsGood: false,
            footer: rejectionFooter,
          }}
        />
      </div>
    </div>
  );
}
