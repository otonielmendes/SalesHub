"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { getAllAssessments } from "@/lib/health-check/store";

export function CalculadoraSubNav() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getAllAssessments().then((data) => setCount(data.length));
  }, []);

  const isHistory = pathname === "/calculadora";
  const isNew =
    pathname?.startsWith("/calculadora/new") ||
    (pathname?.startsWith("/calculadora/") && !isHistory);

  const linkClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-gray-100 text-gray-900"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
    }`;

  return (
    <div className="sticky top-14 z-40 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center h-11 gap-1">
        <Link href="/calculadora/new" className={linkClass(isNew)}>
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Nova Calculadora
        </Link>

        <Link href="/calculadora" className={linkClass(isHistory)}>
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          Histórico
          {count !== null && count > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
