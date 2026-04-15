import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HomeLine } from "@untitledui/icons";
import { createClient } from "@/lib/supabase/server";
import { DemoDetailClient } from "../_components/DemoDetailClient";
import type { DemoSession } from "@/types/demos";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DemoDetailPage({ params }: Props) {
  const { id } = await params;
  const tc = await getTranslations("demos.common");
  const th = await getTranslations("demos.historico");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demo_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const session = data as DemoSession;

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
        <Link href="/demos/device-fingerprinting/historico" className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]" aria-label={tc("homeAria")}>
          <HomeLine className="h-5 w-5" />
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <Link href="/demos/device-fingerprinting/historico" className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
          {tc("deviceFingerprinting")}
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <Link href="/demos/device-fingerprinting/historico" className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
          {th("breadcrumb")}
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <span className="rounded-md px-2 py-1 font-semibold text-[#0C8525]">
          {session.prospect_name ?? tc("fallbackSession")}
        </span>
      </nav>

      <DemoDetailClient session={session} />
    </div>
  );
}
