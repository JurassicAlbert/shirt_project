import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function DocsPage() {
  const t = await getTranslations("docs");

  const links = [
    { href: "/shop", key: "linkShop" as const },
    { href: "/create", key: "linkCreate" as const },
    { href: "/account", key: "linkAccount" as const },
    { href: "/support", key: "linkSupport" as const },
  ];

  return (
    <div className="solid-section max-w-3xl space-y-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
      <p className="text-slate-600">{t("intro")}</p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.key}>
            <Link href={l.href} className="font-semibold text-indigo-600 hover:text-indigo-700">
              {t(l.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
