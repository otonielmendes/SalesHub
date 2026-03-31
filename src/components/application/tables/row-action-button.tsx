"use client";

import type { ComponentPropsWithoutRef, FC } from "react";
import Link from "next/link";
import { cx } from "@/utils/cx";

type ActionIcon = FC<{ className?: string }>;

interface CommonProps {
  label: string;
  icon: ActionIcon;
  variant?: "neutral" | "danger";
  className?: string;
}

type RowActionButtonProps =
  | (CommonProps & {
      href: string;
      onClick?: never;
      disabled?: boolean;
    })
  | (CommonProps & {
      href?: never;
      onClick?: ComponentPropsWithoutRef<"button">["onClick"];
      disabled?: boolean;
    });

const baseClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants = {
  neutral:
    "border-secondary bg-primary text-quaternary hover:border-primary hover:bg-secondary hover:text-secondary focus-visible:outline-brand-secondary",
  danger:
    "border-secondary bg-primary text-quaternary hover:border-error-200 hover:bg-error-50 hover:text-error-700 focus-visible:outline-error-600",
} as const;

export function RowActionButton({
  label,
  icon,
  variant = "neutral",
  className,
  disabled,
  ...props
}: RowActionButtonProps) {
  const Icon = icon;
  const classes = cx(baseClasses, variants[variant], disabled && "pointer-events-none opacity-50", className);

  if ("href" in props && props.href) {
    return (
      <Link
        href={disabled ? "#" : props.href}
        aria-label={label}
        title={label}
        className={classes}
      >
        <Icon className="size-4 shrink-0" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={classes}
      onClick={props.onClick}
    >
      <Icon className="size-4 shrink-0" />
    </button>
  );
}
