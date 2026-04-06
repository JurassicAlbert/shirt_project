"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={`rounded-full px-2.5 py-1 transition ${
            locale === loc ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
          aria-pressed={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
