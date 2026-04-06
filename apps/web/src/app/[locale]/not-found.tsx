import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFoundStore");

  return (
    <div className="solid-section flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t("badge")}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-md text-slate-600">{t("body")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
      >
        {t("homeBtn")}
      </Link>
    </div>
  );
}
