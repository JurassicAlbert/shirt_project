"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function FlowErrorPanel({ message, onRetry, retryLabel }: Props) {
  const t = useTranslations("flow");
  const tc = useTranslations("common");

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900" role="alert">
      <p className="font-medium">{message}</p>
      <p className="mt-2 text-red-800/90">{t("hintRetry")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            {retryLabel ?? tc("retry")}
          </button>
        ) : null}
        <Link href="/search" className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-900">
          {t("contactSupport")}
        </Link>
      </div>
    </div>
  );
}
