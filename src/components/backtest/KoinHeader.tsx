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
    { label: t("backtests"), href: "/backtests/new", section: "backtests" },
    { label: t("calculadora"), href: "/calculadora/new", section: "calculadora" },
    { label: t("fingerprinting"), href: "/fingerprinting/new", section: "fingerprinting" },
  ];

  const BACKTEST_TABS = [
    { label: t("newAnalysis"), href: "/backtests/new", icon: BarChart01 },
    { label: t("historico"), href: "/backtests/historico", icon: FolderClosed },
  ];

  const CALCULADORA_TABS = [
    { label: t("newAnalysis"), href: "/calculadora/new", icon: BarChart01 },
    { label: t("historico"), href: "/calculadora/historico", icon: FolderClosed },
    { label: t("settings"), href: "/calculadora/configuracoes", icon: Settings01 },
  ];

  const FINGERPRINTING_TABS = [
    { label: t("newAnalysis"), href: "/fingerprinting/new", icon: BarChart01 },
    { label: t("historico"), href: "/fingerprinting/history", icon: FolderClosed },
  ];

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    current:
      item.section === "backtests"
        ? pathname.startsWith("/backtests")
        : item.section === "calculadora"
        ? pathname.startsWith("/calculadora")
        : item.section === "fingerprinting"
        ? pathname.startsWith("/fingerprinting")
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
  const isFingerprintingActive = pathname.startsWith("/fingerprinting");

  const calcSubItems = CALCULADORA_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current:
      tab.href === "/calculadora/new"
        ? isCalculadoraAnalisePath(pathname)
        : pathname === tab.href || pathname.startsWith(tab.href + "/"),
  }));

  const fingerprintingSubItems = FINGERPRINTING_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current:
      tab.href === "/fingerprinting/new"
        ? pathname === tab.href
        : pathname === tab.href ||
          /^\/fingerprinting\/(?!new$|history$)[^/]+$/.test(pathname),
  }));

  return (
    <HeaderNavigationBase
      items={navItems}
      subItems={
        isBacktestsActive ? subItems
        : isCalculadoraActive ? calcSubItems
        : isFingerprintingActive ? fingerprintingSubItems
        : undefined
      }
      showAvatarDropdown
      sessionUser={sessionUser}
    />
  );
}
