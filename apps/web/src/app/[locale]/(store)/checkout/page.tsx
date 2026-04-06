"use client";

import { useMemo, useState } from "react";
import { FlowErrorPanel } from "@/components/flow/FlowErrorPanel";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Order = { id: string };

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tt = useTranslations("toast");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [fatal, setFatal] = useState("");
  const [firstName, setFirstName] = useState("Jan");
  const [lastName, setLastName] = useState("Kowalski");
  const [street, setStreet] = useState("Marszałkowska 1");
  const [city, setCity] = useState("Warszawa");
  const [postal, setPostal] = useState("00-001");
  const [country, setCountry] = useState("PL");

  const addressSummary = useMemo(
    () => `${firstName} ${lastName}, ${street}, ${postal} ${city}, ${country}`,
    [firstName, lastName, street, postal, city, country],
  );

  const pay = async () => {
    setBusy(true);
    setFatal("");
    setResult("");

    const createOrder = await fetch("/api/orders", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    const oJson = (await createOrder.json()) as { data?: Order };
    const orderId = oJson.data?.id;
    if (!createOrder.ok || !orderId) {
      setFatal(t("errOrder"));
      setResult("");
      toast.error(tt("error"));
      setBusy(false);
      return;
    }

    const checkout = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        orderId,
        deliveryMethod: "courier",
        paymentMethod: "przelewy24",
        address: {
          firstName,
          lastName,
          city,
          postalCode: postal,
          street,
          country,
        },
      }),
    });
    const cJson = (await checkout.json()) as { data?: { redirectUrl?: string } };
    setBusy(false);
    if (!checkout.ok) {
      setFatal(t("errCheckout"));
      toast.error(tt("error"));
      return;
    }
    const url = cJson.data?.redirectUrl;
    setFatal("");
    setResult(url ? `${t("okRedirect")} ${url}` : t("okRedirect"));
    toast.info(tt("checkoutStarted"));
    if (url?.startsWith("http")) window.location.href = url;
  };

  return (
    <div className="solid-section space-y-10 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="solid-card space-y-4">
            <h2 className="text-lg font-semibold">{t("addressTitle")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("street")}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("city")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("postal")}
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
              />
              <input
                className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder={t("country")}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </section>
          <section className="solid-card space-y-3">
            <h2 className="text-lg font-semibold">{t("paymentTitle")}</h2>
            <p className="text-sm text-slate-600">Przelewy24 — {t("payBtn")}</p>
            <button
              type="button"
              onClick={pay}
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? t("paying") : t("payBtn")}
            </button>
          </section>
        </div>
        <aside className="solid-card h-fit space-y-4">
          <h2 className="text-lg font-semibold">{t("summaryTitle")}</h2>
          <p className="text-sm leading-relaxed text-slate-600">{addressSummary}</p>
          <p className="text-xs text-slate-500">{t("summaryHint")}</p>
        </aside>
      </div>
      {fatal ? <FlowErrorPanel message={fatal} onRetry={() => void pay()} retryLabel={t("payBtn")} /> : null}
      {result ? <p className="text-sm text-slate-600">{result}</p> : null}
    </div>
  );
}
