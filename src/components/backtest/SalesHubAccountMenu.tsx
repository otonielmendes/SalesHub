"use client";

import Link from "next/link";

function initials(email: string, name?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "?";
  return local.slice(0, 2).toUpperCase();
}

export function SalesHubAccountAvatar({
  email,
  name,
  size = "md",
}: {
  email: string;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const s = size === "md" ? "size-10 text-sm" : "size-8 text-xs";
  return (
    <span
      className={`inline-flex ${s} items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800`}
      aria-hidden
    >
      {initials(email, name)}
    </span>
  );
}

export function SalesHubAccountPopoverContent({
  email,
  name,
  isAdmin,
}: {
  email: string;
  name?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <div className="w-64 rounded-xl border border-secondary bg-primary p-1 shadow-lg ring-1 ring-secondary">
      <div className="border-b border-secondary px-3 py-2">
        <p className="truncate text-sm font-semibold text-primary">{name?.trim() || email}</p>
        {name?.trim() && <p className="truncate text-xs text-tertiary">{email}</p>}
      </div>
      <nav className="flex flex-col py-1">
        {isAdmin && (
          <Link
            href="/admin/users"
            className="rounded-md px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt"
          >
            Gestão de usuários
          </Link>
        )}
        <Link
          href="/backtests/configuracoes"
          className="rounded-md px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary_alt"
        >
          Configurações
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-error-800 hover:bg-error-50"
          >
            Sair
          </button>
        </form>
      </nav>
    </div>
  );
}
