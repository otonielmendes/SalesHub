import Link from "next/link";
import { HomeLine } from "@untitledui/icons";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DemoHistoricoTable } from "../_components/DemoHistoricoTable";
import { DemoHistoricoHeaderActions } from "../_components/DemoHistoricoHeaderActions";
import type { DemoSession } from "@/types/demos";

export const dynamic = "force-dynamic";

type DemoRow = Pick<DemoSession, "id" | "prospect_name" | "status" | "created_at" | "expires_at">;

export default async function DemoHistoricoPage() {
  const t = await getTranslations("demos.historico");

  let sessions: DemoRow[] = [];
  let queryError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("demo_sessions")
      .select("id, prospect_name, status, created_at, expires_at")
      .order("created_at", { ascending: false });

    if (error) {
      queryError = error.message;
    } else {
      sessions = (data ?? []) as DemoRow[];
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : t("errors.unexpected");
  }

  if (queryError) {
    return (
      <div className="mx-auto max-w-container px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">{t("errors.loadTitle")}</p>
          <p className="mt-1 text-sm text-error-600">{queryError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
        <Link href="/demos/device-fingerprinting/nova" className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]" aria-label="Fingerprinting">
          <HomeLine className="h-5 w-5" />
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <span className="rounded-md px-2 py-1 font-medium">Fingerprinting</span>
        <span className="text-[#D0D5D7]">/</span>
        <span className="rounded-md px-2 py-1 font-semibold text-[#0C8525]">{t("breadcrumb")}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        </div>
        <DemoHistoricoHeaderActions label={t("buttonNew")} />
      </div>

      <DemoHistoricoTable sessions={sessions} />
    </div>
  );
}
