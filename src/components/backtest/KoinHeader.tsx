"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart01, FolderClosed, Settings02 } from "@untitledui/icons";
import { HeaderNavigationBase, type SessionUserBrief } from "@/components/application/header-navigations/header-navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Backtests", href: "/backtests/testagens" },
  { label: "Demonstrations", href: "/demonstrations" },
  { label: "Guides", href: "/guides" },
];

const BACKTEST_TABS = [
  { label: "Testagens", href: "/backtests/testagens", icon: BarChart01 },
  { label: "Histórico", href: "/backtests/historico", icon: FolderClosed },
  { label: "Configurações", href: "/backtests/configuracoes", icon: Settings02 },
];

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
    current: pathname.startsWith(item.href),
  }));

  const subItems = BACKTEST_TABS.map((tab) => ({
    label: tab.label,
    href: tab.href,
    icon: tab.icon,
    current: pathname === tab.href || pathname.startsWith(tab.href),
  }));

  const isBacktestsActive = pathname.startsWith("/backtests");

  return (
    <HeaderNavigationBase
      items={navItems}
      subItems={isBacktestsActive ? subItems : undefined}
      showAvatarDropdown
      sessionUser={sessionUser}
    />
  );
}
