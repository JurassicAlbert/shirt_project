import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function SupportPage() {
  const t = await getTranslations("support");

  return (
    <div className="solid-section max-w-2xl space-y-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
      <p className="text-slate-600 leading-relaxed">{t("body")}</p>
      <div className="solid-card space-y-2 p-6">
        <p className="text-sm font-semibold text-slate-900">{t("emailLabel")}</p>
        <a href={`mailto:${t("emailValue")}`} className="text-indigo-600 font-medium">
          {t("emailValue")}
        </a>
      </div>
      <Link href="/docs" className="text-sm font-semibold text-indigo-600">
        {t("seeDocs")}
      </Link>
    </div>
  );
}
