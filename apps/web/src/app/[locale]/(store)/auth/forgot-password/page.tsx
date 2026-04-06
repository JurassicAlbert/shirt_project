"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function AuthForgotPasswordPage() {
  const t = useTranslations("auth");
  const ts = useTranslations("authSolid");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="solid-section flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{ts("forgotTitle")}</h1>
        <p className="text-sm text-slate-600">{ts("forgotIntro")}</p>
        <form onSubmit={submit} className="solid-card space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="fp-email">
              {t("email")}
            </label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            />
          </div>
          {sent ? (
            <p className="text-sm text-emerald-600" role="status">
              {ts("forgotStub")}
            </p>
          ) : null}
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white">
            {ts("forgotSubmit")}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600">
          <Link href="/auth/signin" className="font-semibold text-indigo-600">
            {t("goLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
