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
            aria-label="Sales Hub — início"
            className={cx(
                "flex h-8 w-max min-w-0 shrink-0 items-center gap-2 rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                className,
            )}
            {...rest}
        >
            <img
                src="/koin-logomark.svg"
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 shadow-xs"
                aria-hidden
            />
            <span className="truncate text-md font-bold text-primary">
                Sales Hub
            </span>
        </Link>
    );
}
