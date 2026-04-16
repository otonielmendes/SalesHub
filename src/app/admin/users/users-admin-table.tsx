"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { cx } from "@/utils/cx";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login: string | null;
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsersAdminTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUserRow[];
  currentUserId: string;
}) {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedUsers,
  } = usePagination({
    items: users,
    pageSize: 10,
    resetPageKey: users.length,
  });

  const patch = useCallback(async (id: string, updates: { status?: string; role?: string }) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? t("errorUpdate"));
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      );
    } catch {
      setMessage(t("networkError"));
    } finally {
      setBusyId(null);
    }
  }, [t]);

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-800">
          {message}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-secondary bg-secondary_alt">
                <th className="px-4 py-3 text-left font-semibold text-quaternary">{t("colEmail")}</th>
                <th className="px-4 py-3 text-left font-semibold text-quaternary">{t("colName")}</th>
                <th className="px-4 py-3 text-left font-semibold text-quaternary">{t("colStatus")}</th>
                <th className="px-4 py-3 text-left font-semibold text-quaternary">{t("colRole")}</th>
                <th className="px-4 py-3 text-left font-semibold text-quaternary">{t("colCreated")}</th>
                <th className="px-4 py-3 text-right font-semibold text-quaternary">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={cx("border-b border-secondary last:border-0", i % 2 === 1 && "bg-secondary_alt")}
                >
                  <td className="px-4 py-3 font-mono text-xs text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-secondary">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        u.status === "active" && "bg-success-50 text-success-800",
                        u.status === "pending" && "bg-warning-50 text-warning-800",
                        u.status === "disabled" && "bg-gray-100 text-gray-700",
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-secondary">{u.role}</td>
                  <td className="px-4 py-3 text-xs text-tertiary">{formatDate(u.created_at, locale)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {u.status === "pending" && (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { status: "active" })}
                          className="rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {t("actionApprove")}
                        </button>
                      )}
                      {u.status === "active" && u.id !== currentUserId && (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { status: "disabled" })}
                          className="rounded-md border border-error-200 px-2 py-1 text-xs font-semibold text-error-800 hover:bg-error-50 disabled:opacity-50"
                        >
                          {t("actionDisable")}
                        </button>
                      )}
                      {u.status === "disabled" && (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { status: "active" })}
                          className="rounded-md border border-secondary px-2 py-1 text-xs font-semibold text-secondary hover:bg-secondary_alt disabled:opacity-50"
                        >
                          {t("actionReactivate")}
                        </button>
                      )}
                      {u.role === "user" && (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { role: "admin" })}
                          className="rounded-md border border-secondary px-2 py-1 text-xs font-semibold text-secondary hover:bg-secondary_alt disabled:opacity-50"
                        >
                          {t("actionMakeAdmin")}
                        </button>
                      )}
                      {u.role === "admin" && u.id !== currentUserId && (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { role: "user" })}
                          className="rounded-md border border-secondary px-2 py-1 text-xs font-semibold text-secondary hover:bg-secondary_alt disabled:opacity-50"
                        >
                          {t("actionRemoveAdmin")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
