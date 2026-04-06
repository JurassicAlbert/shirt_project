"use client";

import { Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function AdminErrorDemoPage() {
  const t = useTranslations("adminAuth");

  return (
    <div className="text-center">
      <Typography variant="h1" sx={{ fontWeight: 800, fontSize: 72, color: "primary.main" }}>
        404
      </Typography>
      <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
        {t("errorTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("errorBody")}
      </Typography>
      <Button component={Link} href="/admin/login" variant="contained">
        {t("backDashboard")}
      </Button>
    </div>
  );
}
