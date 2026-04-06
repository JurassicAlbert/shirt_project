"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

type Tab = "password" | "magic";

export default function AuthSignInPage() {
  const t = useTranslations("auth");
  const ts = useTranslations("authSolid");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitPassword = async (e: React.FormEvent) => {
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

  const submitMagic = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError(t("errValidation"));
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="solid-section flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{ts("signInTitle")}</h1>
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab("magic")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === "magic" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}
          >
            {ts("tabMagic")}
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === "password" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}
          >
            {ts("tabPassword")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="solid-card flex-1 min-w-[120px] py-2.5 text-center text-xs font-semibold text-slate-700" disabled>
            {ts("ssoGoogle")}
          </button>
          <button type="button" className="solid-card flex-1 min-w-[120px] py-2.5 text-center text-xs font-semibold text-slate-700" disabled>
            {ts("ssoGithub")}
          </button>
        </div>
        {tab === "password" ? (
          <form onSubmit={submitPassword} className="solid-card space-y-4">
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
            <p className="text-right text-sm">
              <Link href="/auth/forgot-password" className="font-semibold text-indigo-600">
                {ts("forgotLink")}
              </Link>
            </p>
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
        ) : (
          <form onSubmit={submitMagic} className="solid-card space-y-4">
            <p className="text-sm text-slate-600">{ts("magicHint")}</p>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="magic-email">
                {t("email")}
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                {ts("magicSentStub")}
              </p>
            ) : null}
            <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white">
              {ts("sendMagicLink")}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-slate-600">
          <Link href="/auth/signup" className="font-semibold text-indigo-600">
            {t("goRegister")}
          </Link>
        </p>
        <p className="text-center text-xs text-slate-500">
          <Link href="/admin/login" className="font-semibold text-slate-600">
            {ts("adminPortalLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
