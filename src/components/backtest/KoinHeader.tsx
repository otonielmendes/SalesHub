"use client";

import { usePathname } from "next/navigation";
import { BarChart01, FolderClosed, Settings02 } from "@untitledui/icons";
import { HeaderNavigationBase } from "@/components/application/header-navigations/header-navigation";

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
    />
  );
}
