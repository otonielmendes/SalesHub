"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart01, FolderClosed } from "@untitledui/icons";
import { HeaderNavigationBase, type SessionUserBrief } from "@/components/application/header-navigations/header-navigation";
import { createClient } from "@/lib/supabase/client";

function isCalculadoraAnalisePath(pathname: string) {
  if (pathname.startsWith("/calculadora/historico")) return false;
  if (pathname.startsWith("/calculadora/configuracoes")) return false;
  return (
    pathname === "/calculadora/new" ||
    pathname === "/calculadora/calculo" ||
    /^\/calculadora\/[^/]+(?:\/export)?$/.test(pathname)
  );
}

export function KoinHeader() {
  const pathname = usePathname();
  const t = useTranslations("nav");
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

  const NAV_ITEMS = [
    { label: t("backtests"), href: "/backtests/testagens" },
    { label: t("calculadora"), href: "/calculadora" },
  ];

  const BACKTEST_TABS = [
    { label: t("testagens"), href: "/backtests/testagens", icon: BarChart01 },
    { label: t("historico"), href: "/backtests/historico", icon: FolderClosed },
  ];

  const CALCULADORA_TABS = [
    { label: t("analise"), href: "/calculadora/calculo", icon: BarChart01 },
    { label: t("historico"), href: "/calculadora/historico", icon: FolderClosed },
  ];

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
