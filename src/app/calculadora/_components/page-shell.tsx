"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HomeLine } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface CalculadoraBreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function CalculadoraPageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("mx-auto w-full max-w-container px-6 py-8 lg:px-8", className)}>{children}</div>;
}

export function CalculadoraPageBreadcrumbs({
  items,
  className,
  homeHref = "/calculadora/historico",
}: {
  items: CalculadoraBreadcrumbItem[];
  className?: string;
  homeHref?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cx("flex flex-wrap items-center gap-3 text-sm text-[#475456]", className)}>
      <Link
        href={homeHref}
        className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]"
        aria-label="Voltar para Calculadora"
      >
        <HomeLine className="h-5 w-5" />
      </Link>

      {items.map((item) => (
        <div key={`${item.label}-${item.href ?? "current"}`} className="flex items-center gap-3">
          <span className="text-[#D0D5D7]">/</span>
          {item.href && !item.current ? (
            <Link href={item.href} className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
              {item.label}
            </Link>
          ) : (
            <span className={cx("rounded-md px-2 py-1 font-medium", item.current ? "font-semibold text-[#0C8525]" : "")}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
