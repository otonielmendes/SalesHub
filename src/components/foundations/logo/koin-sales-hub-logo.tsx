"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

export function KoinSalesHubLogo({
    className,
    ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
        <Link
            href="/"
            aria-label="Koin Sales Hub — início"
            className={cx(
                "flex h-8 w-max min-w-0 shrink-0 items-center gap-2 rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                className,
            )}
            {...rest}
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 text-xs font-bold text-white shadow-xs">
                K
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-brand-700">
                Koin Sales Hub
            </span>
        </Link>
    );
}
