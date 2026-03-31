"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart01, FolderClosed, Settings02 } from "@untitledui/icons";
import { HeaderNavigationBase, type SessionUserBrief } from "@/components/application/header-navigations/header-navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Backtestes", href: "/backtests/testagens" },
  { label: "Calculadora", href: "/calculadora" },
];

const BACKTEST_TABS = [
  { label: "Testagens", href: "/backtests/testagens", icon: BarChart01 },
  { label: "Histórico", href: "/backtests/historico", icon: FolderClosed },
  { label: "Configurações", href: "/backtests/configuracoes", icon: Settings02 },
];

const CALCULADORA_TABS = [
  { label: "Análise", href: "/calculadora/calculo", icon: BarChart01 },
  { label: "Histórico", href: "/calculadora/historico", icon: FolderClosed },
  { label: "Configurações", href: "/calculadora/configuracoes", icon: Settings02 },
];

function isCalculadoraAnalisePath(pathname: string) {
  return (
    pathname === "/calculadora/new" ||
    pathname === "/calculadora/calculo" ||
    /^\/calculadora\/[^/]+(?:\/export)?$/.test(pathname)
  );
}

export function KoinHeader() {
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<SessionUserBrief | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url?.trim() || !key?.trim()) {
      console.error("[KoinHeader] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY em falta");
      return;
    }

    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        setSessionUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single();
      setSessionUser({
        email: user.email,
        name: profile?.name ?? null,
        isAdmin: profile?.role === "admin",
      });
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    current:
      item.href === "/backtests/testagens"
        ? pathname.startsWith("/backtests")
        : item.href === "/calculadora"
        ? pathname.startsWith("/calculadora")
        : pathname.startsWith(item.href),
  }));

  const subItems = BACKTEST_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current: pathname === tab.href || pathname.startsWith(tab.href),
  }));

  const isBacktestsActive = pathname.startsWith("/backtests");
  const isCalculadoraActive = pathname.startsWith("/calculadora");

  const calcSubItems = CALCULADORA_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current:
      tab.href === "/calculadora/calculo"
        ? isCalculadoraAnalisePath(pathname)
        : pathname === tab.href || pathname.startsWith(tab.href + "/"),
  }));

  return (
    <HeaderNavigationBase
      items={navItems}
      subItems={isBacktestsActive ? subItems : isCalculadoraActive ? calcSubItems : undefined}
      showAvatarDropdown
      sessionUser={sessionUser}
    />
  );
}
