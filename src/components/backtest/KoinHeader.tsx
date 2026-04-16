"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart01, FolderClosed, Settings01 } from "@untitledui/icons";
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
      const { data, error } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (error || !user?.email) {
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

    const loadSafely = () => {
      void load().catch(() => {
        setSessionUser(null);
      });
    };

    loadSafely();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSafely();
    });

    return () => subscription.unsubscribe();
  }, []);

  const NAV_ITEMS = [
    { label: t("backtests"), href: "/backtests/testagens", section: "backtests" },
    { label: t("calculadora"), href: "/calculadora/calculo", section: "calculadora" },
    { label: t("fingerprinting"), href: "/demos/device-fingerprinting/nova", section: "demos" },
  ];

  const BACKTEST_TABS = [
    { label: t("newAnalysis"), href: "/backtests/testagens", icon: BarChart01 },
    { label: t("historico"), href: "/backtests/historico", icon: FolderClosed },
  ];

  const CALCULADORA_TABS = [
    { label: t("newAnalysis"), href: "/calculadora/calculo", icon: BarChart01 },
    { label: t("historico"), href: "/calculadora/historico", icon: FolderClosed },
    { label: t("settings"), href: "/calculadora/configuracoes", icon: Settings01 },
  ];

  const DEMOS_TABS = [
    { label: t("newAnalysis"), href: "/demos/device-fingerprinting/nova", icon: BarChart01 },
    { label: t("historico"), href: "/demos/device-fingerprinting/historico", icon: FolderClosed },
  ];

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    current:
      item.section === "backtests"
        ? pathname.startsWith("/backtests")
        : item.section === "calculadora"
        ? pathname.startsWith("/calculadora")
        : item.section === "demos"
        ? pathname.startsWith("/demos")
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
  const isDemosActive = pathname.startsWith("/demos");

  const calcSubItems = CALCULADORA_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current:
      tab.href === "/calculadora/calculo"
        ? isCalculadoraAnalisePath(pathname)
        : pathname === tab.href || pathname.startsWith(tab.href + "/"),
  }));

  const demosSubItems = DEMOS_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current:
      tab.href === "/demos/device-fingerprinting/nova"
        ? pathname === tab.href
        : pathname === tab.href || /^\/demos\/device-fingerprinting\/(?!nova$|historico$)[^/]+$/.test(pathname),
  }));

  return (
    <HeaderNavigationBase
      items={navItems}
      subItems={
        isBacktestsActive ? subItems
        : isCalculadoraActive ? calcSubItems
        : isDemosActive ? demosSubItems
        : undefined
      }
      showAvatarDropdown
      sessionUser={sessionUser}
    />
  );
}
