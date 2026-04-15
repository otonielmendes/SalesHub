"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { getAllAssessments } from "@/lib/health-check/store";
import { cx } from "@/utils/cx";

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "z-10 flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-none px-1 pb-2.5 pt-0 text-sm font-semibold outline-focus-ring transition duration-100 ease-linear",
        "border-b-2 border-transparent -mb-px",
        active ? "border-fg-brand-primary_alt text-brand-secondary" : "text-quaternary hover:text-secondary",
      )}
    >
      {children}
    </Link>
  );
}

export function CalculadoraSubNav() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getAllAssessments().then((data) => setCount(data.length));
  }, []);

  const isHistory = pathname === "/calculadora/historico";
  const isConfig = pathname?.startsWith("/calculadora/configuracoes") ?? false;
  const isAnalise =
    Boolean(pathname?.startsWith("/calculadora")) && !isHistory && !isConfig;

  return (
    <div className="border-b border-secondary bg-primary">
      <div className="relative mx-auto flex h-fit max-w-[1400px] items-stretch gap-0 px-6 pt-6 before:absolute before:inset-x-6 before:bottom-0 before:h-px before:bg-border-secondary">
        <nav className="flex gap-4" aria-label="Calculadora">
          <TabLink href="/calculadora/new" active={isAnalise}>
            Análise
          </TabLink>
          <TabLink href="/calculadora/historico" active={isHistory}>
            Histórico
            {count !== null && count > 0 && (
              <Badge type="pill-color" color="gray" size="sm" className="-my-px">
                {count > 99 ? "99+" : count}
              </Badge>
            )}
          </TabLink>
          <TabLink href="/calculadora/configuracoes" active={isConfig}>
            <Settings01 className="size-4 shrink-0" data-icon />
            Configurações
          </TabLink>
        </nav>
      </div>
    </div>
  );
}
