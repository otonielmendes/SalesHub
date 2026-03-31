"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function AtualizarSenhaPage() {
  const t = useTranslations("auth.updatePassword");
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      readyRef.current = true;
      setReady(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markReady();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        markReady();
      }
    });

    const timer = window.setTimeout(() => {
      if (!cancelled && !readyRef.current) {
        setTimedOut(true);
      }
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("errors.minLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("errors.mismatch"));
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 text-center shadow-lg">
          <p className="text-sm font-semibold text-primary">{t("doneTitle")}</p>
          <p className="mt-2 text-sm text-tertiary">{t("doneDesc")}</p>
          <Link
            href="/login"
            className="mt-6 inline-block h-10 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("doneCta")}
          </Link>
        </div>
      </div>
    );
  }

  if (timedOut && !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <div className="w-full max-w-sm rounded-2xl border border-error-200 bg-error-50 p-8 text-center">
          <p className="text-sm font-semibold text-error-800">{t("expiredTitle")}</p>
          <p className="mt-2 text-sm text-error-700">{t("expiredDesc")}</p>
          <Link href="/recuperar-senha" className="mt-4 inline-block text-sm font-semibold text-brand-700">
            {t("expiredCta")}
          </Link>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-tertiary">{t("validating")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
        <h1 className="text-center text-display-xs font-semibold text-primary">{t("title")}</h1>
        <p className="mt-2 text-center text-sm text-tertiary">{t("subtitle")}</p>

        {error && (
          <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-secondary">
              {t("newPassword")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-secondary">
              {t("confirmPassword")}
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-10 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
