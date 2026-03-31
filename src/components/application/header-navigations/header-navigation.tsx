"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bell01, ChevronDown, LifeBuoy01, SearchLg, Settings01, Settings02 } from "@untitledui/icons";
import { Button as AriaButton, DialogTrigger, Link as AriaLink, Popover } from "react-aria-components";
import { Input } from "@/components/base/input/input";
import { KoinSalesHubLogo } from "@/components/foundations/logo/koin-sales-hub-logo";
import { SalesHubAccountAvatar, SalesHubAccountPopoverContent } from "@/components/backtest/SalesHubAccountMenu";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "./base-components/mobile-header";
import { NavAccountCard, NavAccountMenu } from "./base-components/nav-account-card";
import { NavItemBase } from "./base-components/nav-item";
import { NavList } from "./base-components/nav-list";

type NavItem = {
    /** Label text for the nav item. */
    label: string;
    /** URL to navigate to when the nav item is clicked. */
    href: string;
    /** Whether the nav item is currently active. */
    current?: boolean;
    /** Icon component to display. */
    icon?: FC<{ className?: string }>;
    /** Badge to display. */
    badge?: ReactNode;
    /** List of sub-items to display. */
    items?: NavItem[];
};

export type SessionUserBrief = {
    email: string;
    name?: string | null;
    isAdmin?: boolean;
};

interface HeaderNavigationBaseProps {
    /** List of items to display. */
    items: NavItem[];
    /** List of sub-items to display. */
    subItems?: NavItem[];
    /** Content to display in the trailing position. */
    trailingContent?: ReactNode;
    /** Whether to show the avatar dropdown. */
    showAvatarDropdown?: boolean;
    /** Whether to hide the bottom border. */
    hideBorder?: boolean;
    /** When set, replaces template demo account / external links (Koin Sales Hub). */
    sessionUser?: SessionUserBrief | null;
}

const LANGUAGE_OPTIONS = [
    { value: "pt-BR", label: "PT" },
    { value: "en", label: "EN" },
    { value: "es", label: "ES" },
] as const;

function HeaderLanguageSelect() {
    const [locale, setLocale] = useState(() => {
        if (typeof window === "undefined") return "pt-BR";
        return window.localStorage.getItem("sales-hub-locale") ?? "pt-BR";
    });

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return (
        <div className="relative">
            <select
                aria-label="Selecionar idioma"
                value={locale}
                onChange={(event) => {
                    const nextLocale = event.target.value;
                    setLocale(nextLocale);
                    window.localStorage.setItem("sales-hub-locale", nextLocale);
                    document.documentElement.lang = nextLocale;
                }}
                className="h-9 appearance-none rounded-lg border border-transparent bg-primary px-3 py-2 pr-8 text-sm font-medium text-secondary transition-colors hover:bg-secondary focus:border-secondary focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
                {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
        </div>
    );
}

export const HeaderNavigationBase = ({
    items,
    subItems,
    trailingContent,
    showAvatarDropdown = true,
    hideBorder = false,
    sessionUser,
}: HeaderNavigationBaseProps) => {
    const activeSubNavItems = subItems || items.find((item) => item.current && item.items && item.items.length > 0)?.items;

    const showSecondaryNav = activeSubNavItems && activeSubNavItems.length > 0;

    const mobileAccount = sessionUser ? (
        <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-secondary_alt p-3">
            <div className="flex items-center gap-3">
                <SalesHubAccountAvatar email={sessionUser.email} name={sessionUser.name} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">
                        {sessionUser.name?.trim() || sessionUser.email}
                    </p>
                    {sessionUser.name?.trim() && (
                        <p className="truncate text-xs text-tertiary">{sessionUser.email}</p>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-secondary pt-2">
                {sessionUser.isAdmin && (
                    <NavItemBase type="link" href="/admin/users" icon={Settings01}>
                        Gestão de usuários
                    </NavItemBase>
                )}
                <NavItemBase type="link" href="/backtests/configuracoes" icon={Settings01}>
                    Configurações
                </NavItemBase>
                <form action="/api/auth/logout" method="POST" className="px-1.5">
                    <button
                        type="submit"
                        className="w-full rounded-md px-2 py-2 text-left text-sm font-semibold text-error-800 hover:bg-error-50"
                    >
                        Sair
                    </button>
                </form>
            </div>
        </div>
    ) : (
        <NavAccountCard />
    );

    return (
        <>
            <MobileNavigationHeader>
                <aside className="flex h-full max-w-full flex-col justify-between overflow-auto border-r border-secondary bg-primary pt-4 lg:pt-6">
                    <div className="flex flex-col gap-5 px-4 lg:px-5">
                        <KoinSalesHubLogo className="h-8" />
                        <Input shortcut size="sm" aria-label="Buscar" placeholder="Buscar" icon={SearchLg} />
                    </div>

                    <NavList items={items} />

                    <div className="mt-auto flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6">
                        <div className="flex flex-col gap-1">
                            {sessionUser ? (
                                <NavItemBase type="link" href="/backtests/configuracoes" icon={LifeBuoy01}>
                                    Suporte / Configurações
                                </NavItemBase>
                            ) : (
                                <>
                                    <NavItemBase type="link" href="#" icon={LifeBuoy01}>
                                        Support
                                    </NavItemBase>
                                    <NavItemBase type="link" href="#" icon={Settings01}>
                                        Settings
                                    </NavItemBase>
                                </>
                            )}
                        </div>

                        {mobileAccount}
                    </div>
                </aside>
            </MobileNavigationHeader>

            <header className="max-lg:hidden">
                <section
                    className={cx(
                        "flex h-16 w-full items-center justify-center bg-primary md:h-18",
                        (!hideBorder || showSecondaryNav) && "border-b border-secondary",
                    )}
                >
                    <div className="flex w-full max-w-container justify-between pr-3 pl-4 md:px-8">
                        <div className="flex flex-1 items-center gap-4">
                            <KoinSalesHubLogo className="h-8" />

                            <nav>
                                <ul className="flex items-center gap-0.5">
                                    {items.map((item) => (
                                        <li key={item.label} className="py-0.5">
                                            <NavItemBase icon={item.icon} href={item.href} current={item.current} badge={item.badge} type="link">
                                                {item.label}
                                            </NavItemBase>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {trailingContent}

                            <HeaderLanguageSelect />

                            <button
                                type="button"
                                aria-label="Configurações"
                                className="flex size-9 items-center justify-center rounded-lg text-quaternary transition-colors hover:bg-secondary hover:text-secondary"
                            >
                                <Settings02 className="size-[18px]" />
                            </button>

                            <button
                                type="button"
                                aria-label="Notificações"
                                className="flex size-9 items-center justify-center rounded-lg text-quaternary transition-colors hover:bg-secondary hover:text-secondary"
                            >
                                <Bell01 className="size-[18px]" />
                            </button>

                            {showAvatarDropdown && sessionUser && (
                                <DialogTrigger>
                                    <AriaButton
                                        className={({ isPressed, isFocused }) =>
                                            cx(
                                                "group relative inline-flex cursor-pointer rounded-full",
                                                (isPressed || isFocused) && "outline-2 outline-offset-2 outline-focus-ring",
                                            )
                                        }
                                    >
                                        <SalesHubAccountAvatar email={sessionUser.email} name={sessionUser.name} />
                                    </AriaButton>
                                    <Popover
                                        placement="bottom right"
                                        offset={8}
                                        className={({ isEntering, isExiting }) =>
                                            cx(
                                                "will-change-transform",
                                                isEntering &&
                                                    "duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
                                                isExiting &&
                                                    "duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
                                            )
                                        }
                                    >
                                        <SalesHubAccountPopoverContent
                                            email={sessionUser.email}
                                            name={sessionUser.name}
                                            isAdmin={sessionUser.isAdmin}
                                        />
                                    </Popover>
                                </DialogTrigger>
                            )}

                            {showAvatarDropdown && !sessionUser && (
                                <DialogTrigger>
                                    <AriaButton
                                        className={({ isPressed, isFocused }) =>
                                            cx(
                                                "group relative inline-flex cursor-pointer",
                                                (isPressed || isFocused) && "rounded-full outline-2 outline-offset-2 outline-focus-ring",
                                            )
                                        }
                                    >
                                        <span className="flex size-10 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                            …
                                        </span>
                                    </AriaButton>
                                    <Popover
                                        placement="bottom right"
                                        offset={8}
                                        className={({ isEntering, isExiting }) =>
                                            cx(
                                                "will-change-transform",
                                                isEntering &&
                                                    "duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
                                                isExiting &&
                                                    "duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
                                            )
                                        }
                                    >
                                        <NavAccountMenu />
                                    </Popover>
                                </DialogTrigger>
                            )}
                        </div>
                    </div>
                </section>

                {showSecondaryNav && (
                    <section className={cx("flex h-16 w-full items-center justify-center bg-primary", !hideBorder && "border-b border-secondary")}>
                        <div className="flex w-full max-w-container items-center justify-between gap-8 px-8">
                            <nav>
                                <ul className="flex items-center gap-2">
                                    {activeSubNavItems.map((item) => (
                                        <li key={item.label}>
                                            <AriaLink
                                                href={item.href}
                                                aria-current={item.current ? "page" : undefined}
                                                className={cx(
                                                    "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                                                    item.current
                                                        ? "bg-[#E4FBE9] text-[#0C8525]"
                                                        : "text-[#667085] hover:bg-[#F9FAFB] hover:text-[#475467]",
                                                )}
                                            >
                                                {item.icon && <item.icon className="size-5 shrink-0" />}
                                                <span>{item.label}</span>
                                                {item.badge ? (
                                                    typeof item.badge === "string" || typeof item.badge === "number" ? (
                                                        <span
                                                            className={cx(
                                                                "rounded-full px-3 py-1 text-xs font-semibold",
                                                                item.current ? "bg-[#2BE34F] text-[#0C8525]" : "bg-[#D0D5DD] text-[#475467]",
                                                            )}
                                                        >
                                                            {item.badge}
                                                        </span>
                                                    ) : (
                                                        item.badge
                                                    )
                                                ) : null}
                                            </AriaLink>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            <Input shortcut aria-label="Buscar" placeholder="Buscar" icon={SearchLg} size="sm" className="max-w-xs" />
                        </div>
                    </section>
                )}
            </header>
        </>
    );
};
