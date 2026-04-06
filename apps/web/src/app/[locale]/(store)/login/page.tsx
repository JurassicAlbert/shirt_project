"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (password.length < 8 || !email.includes("@")) {
      setError(t("errValidation"));
      setBusy(false);
      return;
    }
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: { code?: string } };
    setBusy(false);
    if (!res.ok) {
      if (json.error?.code === "UNAUTHORIZED") setError(t("errUnauthorized"));
      else setError(t("errGeneric"));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/account"), 800);
  };

  return (
    <div className="solid-section flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
        <form onSubmit={submit} className="solid-card space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              minLength={8}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-600" role="status">
              {t("successLogin")}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("submitLogin")}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          <Link href="/register" className="font-semibold text-indigo-600">
            {t("goRegister")}
          </Link>
        </p>
      </div>
    </div>
  );
}
