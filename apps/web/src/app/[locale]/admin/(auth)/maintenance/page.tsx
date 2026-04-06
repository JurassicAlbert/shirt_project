"use client";

import { Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export default function AdminMaintenancePage() {
  const t = useTranslations("adminAuth");

  return (
    <div className="text-center">
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("maintenanceTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("maintenanceBody")}
      </Typography>
    </div>
  );
}
